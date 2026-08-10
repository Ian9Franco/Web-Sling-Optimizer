import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const maxKB = parseFloat((formData.get('maxKB') as string) || '200');
    const resizeMode = (formData.get('resizeMode') as string) || 'none'; // 'none' | 'custom'
    const maxWidth = parseInt((formData.get('maxWidth') as string) || '0', 10);
    const maxHeight = parseInt((formData.get('maxHeight') as string) || '0', 10);
    const preferredFormat = (formData.get('format') as string) || 'original'; // 'original' | 'jpg' | 'webp' | 'png' | 'avif'

    // Nuevas opciones avanzadas de recorte y transformaciones
    const rotateAngle = parseInt((formData.get('rotate') as string) || '0', 10);
    const flipHorizontal = formData.get('flip') === 'true';
    const applyGrayscale = formData.get('grayscale') === 'true';
    const stripExif = formData.get('stripExif') !== 'false';
    const watermarkText = (formData.get('watermarkText') as string || '').trim();
    const customName = (formData.get('customName') as string || '').trim();
    
    // Opciones avanzadas de Recorte y Aspect Ratio
    const cropFit = (formData.get('cropFit') as string) || 'inside'; // 'inside' | 'cover' | 'contain'
    const cropPosition = (formData.get('cropPosition') as string) || 'center'; // 'center' | 'top' | 'bottom' | 'left' | 'right' | 'entropy' | 'attention'

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Metadata original
    const metadata = await sharp(inputBuffer).metadata();
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
    let finalBuffer: Buffer = inputBuffer;
    let actualFormat = targetExt.replace('.', '');
    if (actualFormat === 'jpeg') actualFormat = 'jpg';

    // Generar Buffer SVG de marca de agua si aplica
    let watermarkSvgBuffer: Buffer | null = null;
    if (watermarkText) {
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
            ${watermarkText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </text>
        </svg>
      `;
      watermarkSvgBuffer = Buffer.from(svgText);
    }

    // Proceso iterativo de compresión
    while (quality >= 15) {
      let pipeline = sharp(inputBuffer);

      // Conservar metadatos solo si el usuario no activó la eliminación EXIF
      if (!stripExif) {
        pipeline = pipeline.withMetadata();
      }

      // Rotación y espejo
      if (rotateAngle > 0) {
        pipeline = pipeline.rotate(rotateAngle);
      }
      if (flipHorizontal) {
        pipeline = pipeline.flop();
      }

      // Efecto Blanco y Negro
      if (applyGrayscale) {
        pipeline = pipeline.grayscale();
      }

      // Resizing & Recorte sin deformar (Crop / Aspect Ratio)
      if (resizeMode === 'custom' && (maxWidth > 0 || maxHeight > 0)) {
        pipeline = pipeline.resize(
          maxWidth > 0 ? maxWidth : undefined,
          maxHeight > 0 ? maxHeight : undefined,
          {
            fit: (cropFit === 'cover' ? 'cover' : cropFit === 'contain' ? 'contain' : 'inside') as any,
            position: cropPosition as any,
            withoutEnlargement: cropFit === 'cover' ? false : true,
            kernel: sharp.kernel.lanczos3,
          }
        );
      }

      // Superposición de Marca de Agua
      if (watermarkSvgBuffer) {
        pipeline = pipeline.composite([
          {
            input: watermarkSvgBuffer,
            gravity: 'southeast',
          },
        ]);
      }

      if (targetExt === '.png') {
        finalBuffer = await pipeline.png({ quality, compressionLevel: 9, palette: true }).toBuffer();
        if (finalBuffer.length > maxSizeBytes && preferredFormat === 'original') {
          targetExt = '.jpg';
          actualFormat = 'jpg';
          continue;
        }
      } else if (targetExt === '.webp') {
        finalBuffer = await pipeline.webp({ quality }).toBuffer();
      } else if (targetExt === '.avif') {
        finalBuffer = await pipeline.avif({ quality }).toBuffer();
      } else {
        finalBuffer = await pipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
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

    return NextResponse.json({
      success: true,
      originalName: file.name,
      outputFileName: `${baseName}${targetExt}`,
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
  } catch (error: any) {
    console.error('Error procesando imagen:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error al procesar la imagen.' },
      { status: 500 }
    );
  }
}
