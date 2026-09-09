import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { RAW_CAMERA_REGEX } from '../../../utils/supportedFormats';

// Límite de carga serverless para evitar fallos de infraestructura (4.5 MB)
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const preserveQuality = formData.get('preserveQuality') === 'true';
    const rawQuality = formData.get('quality') ? parseInt(formData.get('quality') as string, 10) : undefined;
    const hasExplicitQuality = rawQuality !== undefined && !isNaN(rawQuality);
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
    const containBackground = (formData.get('containBackground') as string) || 'blur'; // 'blur' | 'black' | 'white' | 'transparent'

    // Opciones de Super-Resolución (Lanczos3 Upscaling) & Claridad HD
    const upscaleFactor = parseInt((formData.get('upscaleFactor') as string) || '1', 10); // 1 | 2 | 4
    const applyClarity = formData.get('clarity') === 'true';

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

    // Si es un archivo RAW o formato no soportado de forma nativa por browsers,
    // por defecto lo exportamos a JPG limpio si no se seleccionó otro formato.
    const isRawCameraFile = RAW_CAMERA_REGEX.test(file.name);

    let targetExt = ext;
    if (preferredFormat === 'jpg' || preferredFormat === 'jpeg') targetExt = '.jpg';
    else if (preferredFormat === 'webp') targetExt = '.webp';
    else if (preferredFormat === 'png') targetExt = '.png';
    else if (preferredFormat === 'avif') targetExt = '.avif';
    else if (preferredFormat === 'tiff' || preferredFormat === 'tif') targetExt = '.tiff';
    else if (preferredFormat === 'gif') targetExt = '.gif';
    else if (preferredFormat === 'heic' || preferredFormat === 'heif') targetExt = '.heic';
    else if (preferredFormat === 'original' && isRawCameraFile) targetExt = '.jpg';

    // Salvaguarda: si targetExt no es un formato de salida soportado, exportar a jpg
    if (!['.jpg', '.jpeg', '.webp', '.png', '.avif', '.tiff', '.tif', '.gif', '.heic', '.heif'].includes(targetExt)) {
      targetExt = '.jpg';
    }

    const maxSizeBytes = maxKB * 1024;
    let quality = hasExplicitQuality ? Math.max(1, Math.min(100, rawQuality!)) : 90;
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

    // Super-Resolución / Upscaling (2x, 4x) o Redimensionamiento personalizado
    if (resizeMode === 'custom' && (maxWidth > 0 || maxHeight > 0)) {
      if (cropFit === 'contain' && containBackground === 'blur' && maxWidth > 0 && maxHeight > 0) {
        // Modo Relleno Inteligente con Fondo Desenfocado Ultra Rápido y Cinemático
        const lowResW = Math.max(160, Math.round(maxWidth / 4));
        const lowResH = Math.max(160, Math.round(maxHeight / 4));

        const bgBuffer = await sharp(inputBuffer)
          .rotate(rotateAngle > 0 ? rotateAngle : 0)
          .resize(lowResW, lowResH, { fit: 'cover', position: 'center' })
          .blur(12)
          .resize(maxWidth, maxHeight, { fit: 'cover' })
          .modulate({ brightness: 0.65, saturation: 1.15 })
          .png()
          .toBuffer();

        const fgBuffer = await transformPipeline
          .resize(maxWidth, maxHeight, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
          .png()
          .toBuffer();

        transformPipeline = sharp(bgBuffer).composite([
          { input: fgBuffer, gravity: 'center' }
        ]);
      } else if (cropFit === 'contain') {
        let bgCol: { r: number; g: number; b: number; alpha: number } = { r: 9, g: 11, b: 16, alpha: 1 };
        if (containBackground === 'black') bgCol = { r: 0, g: 0, b: 0, alpha: 1 };
        else if (containBackground === 'white') bgCol = { r: 255, g: 255, b: 255, alpha: 1 };
        else if (containBackground === 'transparent') bgCol = { r: 0, g: 0, b: 0, alpha: 0 };

        transformPipeline = transformPipeline.resize(
          maxWidth > 0 ? maxWidth : undefined,
          maxHeight > 0 ? maxHeight : undefined,
          {
            fit: 'contain',
            position: 'center',
            background: bgCol,
            withoutEnlargement: false,
            kernel: sharp.kernel.lanczos3,
          }
        );
      } else {
        transformPipeline = transformPipeline.resize(
          maxWidth > 0 ? maxWidth : undefined,
          maxHeight > 0 ? maxHeight : undefined,
          {
            fit: cropFit === 'cover' ? 'cover' : 'inside',
            position: cropPosition as any,
            withoutEnlargement: cropFit === 'cover' ? false : true,
            kernel: sharp.kernel.lanczos3,
          }
        );
      }
    } else if (upscaleFactor > 1 && originalWidth > 0 && originalHeight > 0) {
      // Upscaling con interpolación Lanczos3 de alta fidelidad
      const targetUpscaleW = Math.round(originalWidth * upscaleFactor);
      const targetUpscaleH = Math.round(originalHeight * upscaleFactor);
      transformPipeline = transformPipeline.resize(targetUpscaleW, targetUpscaleH, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3,
      });
    }

    // Claridad HD / Unsharp Masking + Reducción de ruido sutil
    if (applyClarity) {
      transformPipeline = transformPipeline
        .sharpen({ sigma: 1.2, m1: 1.6, m2: 0.7 })
        .median(1);
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

    const hasVisualTransforms = (
      rotateAngle > 0 ||
      flipHorizontal ||
      applyGrayscale ||
      applyClarity ||
      upscaleFactor > 1 ||
      isRawCameraFile ||
      watermarkText !== '' ||
      (resizeMode === 'custom' && (maxWidth > 0 || maxHeight > 0)) ||
      (preferredFormat !== 'original' && preferredFormat !== ext.replace('.', ''))
    );

    // Si el usuario convierte a PNG o TIFF desde otro formato, el peso suele aumentar naturalmente;
    // de lo contrario, el objetivo SIEMPRE debe ser reducir el peso respecto al original (o maxKB si es más restrictivo)
    const isConvertingToUncompressed = (targetExt === '.png' && ext !== '.png') || (targetExt === '.tiff' && ext !== '.tiff');
    const effectiveTargetBytes = isConvertingToUncompressed 
      ? maxSizeBytes 
      : Math.min(maxSizeBytes, Math.floor(originalSize * 0.95));

    // ETAPA 2: Proceso de codificación
    if (hasExplicitQuality) {
      // MODO CALIDAD CONFIGURABLE: Codificar con el porcentaje exacto elegido por el usuario (ej. 80%, 75%)
      const encodePipeline = sharp(transformedBuffer);
      if (targetExt === '.png') {
        finalBuffer = await encodePipeline.png({ quality, compressionLevel: 9, palette: quality < 100 }).toBuffer();
      } else if (targetExt === '.webp') {
        finalBuffer = await encodePipeline.webp({ quality }).toBuffer();
      } else if (targetExt === '.avif') {
        finalBuffer = await encodePipeline.avif({ quality }).toBuffer();
      } else if (targetExt === '.tiff' || targetExt === '.tif') {
        finalBuffer = await encodePipeline.tiff({ quality, compression: 'deflate' }).toBuffer();
      } else if (targetExt === '.gif') {
        finalBuffer = await encodePipeline.gif().toBuffer();
      } else if (targetExt === '.heic' || targetExt === '.heif') {
        finalBuffer = await encodePipeline.heif({ quality, compression: 'hevc' }).toBuffer();
      } else {
        finalBuffer = await encodePipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
      }
    } else if (preserveQuality) {
      // MODO PRESERVAR CALIDAD (por defecto): No degradar la imagen destructivamente.
      // Si no hay transformaciones visuales ni cambio de formato, conservar el original.
      if (!hasVisualTransforms && (preferredFormat === 'original' || preferredFormat === ext.replace('.', ''))) {
        if (!stripExif) {
          finalBuffer = inputBuffer;
        } else {
          // Solo quitar EXIF sin degradar compresión
          finalBuffer = await sharp(inputBuffer).toBuffer();
        }
        quality = 100;
      } else {
        // Se aplicó redimensionado, rotación o conversión de formato: codificar en máxima calidad sin bajar por KB
        quality = 95;
        const encodePipeline = sharp(transformedBuffer);
        if (targetExt === '.png') {
          finalBuffer = await encodePipeline.png({ compressionLevel: 9 }).toBuffer();
        } else if (targetExt === '.webp') {
          finalBuffer = await encodePipeline.webp({ quality: 95, effort: 6 }).toBuffer();
        } else if (targetExt === '.avif') {
          finalBuffer = await encodePipeline.avif({ quality: 90, effort: 6 }).toBuffer();
        } else if (targetExt === '.tiff' || targetExt === '.tif') {
          finalBuffer = await encodePipeline.tiff({ quality: 95, compression: 'deflate' }).toBuffer();
        } else if (targetExt === '.gif') {
          finalBuffer = await encodePipeline.gif().toBuffer();
        } else if (targetExt === '.heic' || targetExt === '.heif') {
          finalBuffer = await encodePipeline.heif({ quality: 90, compression: 'hevc' }).toBuffer();
        } else {
          finalBuffer = await encodePipeline.jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
        }
      }
    } else {
      // MODO REDUCCIÓN POR OBJETIVO DE KB (Opcional): Bucle iterativo de compresión
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
        } else if (targetExt === '.tiff' || targetExt === '.tif') {
          finalBuffer = await encodePipeline.tiff({ quality, compression: 'deflate' }).toBuffer();
        } else if (targetExt === '.gif') {
          finalBuffer = await encodePipeline.gif().toBuffer();
        } else if (targetExt === '.heic' || targetExt === '.heif') {
          finalBuffer = await encodePipeline.heif({ quality, compression: 'hevc' }).toBuffer();
        } else {
          finalBuffer = await encodePipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:2:0' }).toBuffer();
        }

        if (finalBuffer.length <= effectiveTargetBytes) {
          break;
        }

        quality -= 5;
      }
    }

    // Salvaguarda Global: Si tras cualquier proceso la imagen resultante es más pesada que la original
    // y no se aplicaron transformaciones visuales ni cambio forzado de formato, conservar el archivo 100% original.
    if (!hasVisualTransforms && finalBuffer.length >= originalSize && (preferredFormat === 'original' || preferredFormat === ext.replace('.', ''))) {
      finalBuffer = inputBuffer;
      actualFormat = ext.replace('.', '') === 'jpeg' ? 'jpg' : ext.replace('.', '');
      quality = 100;
    }

    const compressedSize = finalBuffer.length;
    const savedBytes = originalSize - compressedSize;
    const savedPercentage = parseFloat(((savedBytes / originalSize) * 100).toFixed(1));

    const finalMetadata = await sharp(finalBuffer).metadata();
    const finalWidth = finalMetadata.width || originalWidth;
    const finalHeight = finalMetadata.height || originalHeight;

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      tiff: 'image/tiff',
      tif: 'image/tiff',
      gif: 'image/gif',
      heic: 'image/heif',
      heif: 'image/heif',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
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
      savedPercentage,
      base64Data,
      mimeType,
      upscaleApplied: upscaleFactor > 1 ? upscaleFactor : undefined,
      clarityApplied: applyClarity || undefined,
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
