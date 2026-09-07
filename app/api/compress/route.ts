import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Límite de carga serverless para evitar fallos de infraestructura (4.5 MB)
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const maxKB = parseFloat((formData.get('maxKB') as string) || '200');
    const resizeMode = (formData.get('resizeMode') as string) || 'none'; // 'none' | 'custom'
    const maxWidth = parseInt((formData.get('maxWidth') as string) || '0', 10);
    const maxHeight = parseInt((formData.get('maxHeight') as string) || '0', 10);
    const preferredFormat = (formData.get('format') as string) || 'original'; // 'original' | 'jpg' | 'webp' | 'png' | 'avif'

    // Opciones avanzadas de transformaciones
    const rotateAngle = parseInt((formData.get('rotate') as string) || '0', 10);
    const flipHorizontal = formData.get('flip') === 'true';
    const applyGrayscale = formData.get('grayscale') === 'true';
    const stripExif = formData.get('stripExif') !== 'false';
    const watermarkText = (formData.get('watermarkText') as string || '').trim();
    const customName = (formData.get('customName') as string || '').trim();
    const itemIndex = (formData.get('index') as string || '').trim();
    
    // Opciones avanzadas de Recorte y Aspect Ratio
    const cropFit = (formData.get('cropFit') as string) || 'inside'; // 'inside' | 'cover' | 'contain'
    const cropPosition = (formData.get('cropPosition') as string) || 'center'; // 'center' | 'top' | 'bottom' | 'left' | 'right' | 'entropy' | 'attention'

    // 1. Validación: Archivo presente
    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
    }

    // 2. Validación: Tamaño máximo (4.5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo permitido de 4.5 MB (${sizeMB} MB).` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 3. Validación: Integridad y formato de imagen con sharp
    let metadata;
    try {
      metadata = await sharp(inputBuffer).metadata();
      if (!metadata.format) {
        return NextResponse.json(
          { error: 'El archivo subido no contiene un formato de imagen reconocido.' },
          { status: 415 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida o está dañado.' },
        { status: 415 }
      );
    }

    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    const originalSize = inputBuffer.length;

    let ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    let defaultBaseName = file.name.substring(0, file.name.lastIndexOf('.'));
    if (!defaultBaseName) defaultBaseName = file.name;

    let baseName = customName ? customName.replace(/\.[^/.]+$/, "") : defaultBaseName;

    let targetExt = ext;
    if (preferredFormat === 'jpg' || preferredFormat === 'jpeg') targetExt = '.jpg';
    else if (preferredFormat === 'webp') targetExt = '.webp';
    else if (preferredFormat === 'png') targetExt = '.png';
    else if (preferredFormat === 'avif') targetExt = '.avif';

    const maxSizeBytes = maxKB * 1024;
    let quality = 90;
    let actualFormat = targetExt.replace('.', '');
    if (actualFormat === 'jpeg') actualFormat = 'jpg';

    // Generar Buffer SVG de marca de agua si aplica
    let watermarkSvgBuffer: Buffer | null = null;
    if (watermarkText) {
      const sanitizedText = watermarkText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const svgText = `
        <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
          <text 
            x="50%" 
            y="50%" 
            font-family="sans-serif" 
            font-size="24" 
            font-weight="bold"
            fill="white" 
            fill-opacity="0.55" 
            stroke="black"
            stroke-width="1"
            stroke-opacity="0.3"
            text-anchor="middle" 
            dominant-baseline="middle"
          >
            ${sanitizedText}
          </text>
        </svg>
      `;
      watermarkSvgBuffer = Buffer.from(svgText);
    }

    // ETAPA 1: Pipeline de transformaciones geométricas y filtros (ejecutado UNA sola vez)
    let transformPipeline = sharp(inputBuffer);

    if (!stripExif) {
      transformPipeline = transformPipeline.withMetadata();
    }
    if (rotateAngle > 0) {
      transformPipeline = transformPipeline.rotate(rotateAngle);
    }
    if (flipHorizontal) {
      transformPipeline = transformPipeline.flop();
    }
    if (applyGrayscale) {
      transformPipeline = transformPipeline.grayscale();
    }
    if (resizeMode === 'custom' && (maxWidth > 0 || maxHeight > 0)) {
      transformPipeline = transformPipeline.resize(
        maxWidth > 0 ? maxWidth : undefined,
        maxHeight > 0 ? maxHeight : undefined,
        {
          fit: (cropFit === 'cover' ? 'cover' : cropFit === 'contain' ? 'contain' : 'inside') as 'cover' | 'contain' | 'inside',
          position: cropPosition as any,
          withoutEnlargement: cropFit === 'cover' ? false : true,
          kernel: sharp.kernel.lanczos3,
        }
      );
    }
    if (watermarkSvgBuffer) {
      transformPipeline = transformPipeline.composite([
        {
          input: watermarkSvgBuffer,
          gravity: 'southeast',
        },
      ]);
    }

    // Buffer base transformado en PNG lossless sin compresión (rápido en memoria, conserva alpha y metadatos)
    const transformedBuffer = await transformPipeline.png({ compressionLevel: 0 }).toBuffer();

    let finalBuffer: Buffer = transformedBuffer;

    // ETAPA 2: Proceso iterativo de codificación (re-encode sólo sobre la imagen ya transformada)
    while (quality >= 15) {
      const encodePipeline = sharp(transformedBuffer);

      if (targetExt === '.png') {
        finalBuffer = await encodePipeline.png({ quality, compressionLevel: 9, palette: true }).toBuffer();
        if (finalBuffer.length > maxSizeBytes && preferredFormat === 'original') {
          targetExt = '.jpg';
          actualFormat = 'jpg';
          continue;
        }
      } else if (targetExt === '.webp') {
        finalBuffer = await encodePipeline.webp({ quality }).toBuffer();
      } else if (targetExt === '.avif') {
        finalBuffer = await encodePipeline.avif({ quality }).toBuffer();
      } else {
        finalBuffer = await encodePipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
      }

      if (finalBuffer.length <= maxSizeBytes) {
        break;
      }

      quality -= 5;
    }

    const compressedSize = finalBuffer.length;
    const savedBytes = originalSize - compressedSize;
    const savedPercentage = savedBytes > 0 ? ((savedBytes / originalSize) * 100).toFixed(1) : '0';

    const finalMetadata = await sharp(finalBuffer).metadata();
    const finalWidth = finalMetadata.width || originalWidth;
    const finalHeight = finalMetadata.height || originalHeight;

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };

    const mimeType = mimeTypes[actualFormat] || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${finalBuffer.toString('base64')}`;

    // Resolución de patrones dinámicos de nombre
    let outputFileName = `${baseName}${targetExt}`;
    if (customName) {
      let resolved = customName
        .replace(/\{original\}|\{name\}/gi, defaultBaseName)
        .replace(/\{width\}/gi, finalWidth.toString())
        .replace(/\{height\}/gi, finalHeight.toString())
        .replace(/\{format\}/gi, actualFormat)
        .replace(/\{quality\}/gi, quality.toString());
      if (itemIndex) {
        resolved = resolved.replace(/\{index\}|\{idx\}/gi, itemIndex);
      }
      // Limpiar extensión si vino embebida y concatenar la extensión de salida correspondiente
      resolved = resolved.replace(/\.[^/.]+$/, "");
      outputFileName = `${resolved}${targetExt}`;
    }

    return NextResponse.json({
      success: true,
      originalName: file.name,
      outputFileName,
      originalWidth,
      originalHeight,
      finalWidth,
      finalHeight,
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      qualityApplied: quality,
      formatApplied: actualFormat.toUpperCase(),
      savedPercentage: parseFloat(savedPercentage),
      base64Data,
      mimeType,
    });
  } catch (error: unknown) {
    console.error('Error procesando imagen:', error);
    const message = error instanceof Error ? error.message : 'Ocurrió un error al procesar la imagen.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
