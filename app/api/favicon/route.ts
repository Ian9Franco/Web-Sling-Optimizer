import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateWebManifest, generateHeadSnippet, DEFAULT_FAVICON_METADATA } from '../../../utils/faviconHelper';
import { FaviconMetadata } from '../../../types/image';

// Límite de carga serverless (4.5 MB)
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customName = (formData.get('customName') as string || 'favicon').trim().toLowerCase().replace(/\.[^/.]+$/, "");
    
    // Optional custom metadata passed from frontend
    const appName = (formData.get('appName') as string) || DEFAULT_FAVICON_METADATA.appName;
    const shortName = (formData.get('shortName') as string) || DEFAULT_FAVICON_METADATA.shortName;
    const description = (formData.get('description') as string) || DEFAULT_FAVICON_METADATA.description;
    const themeColor = (formData.get('themeColor') as string) || DEFAULT_FAVICON_METADATA.themeColor;
    const backgroundColor = (formData.get('backgroundColor') as string) || DEFAULT_FAVICON_METADATA.backgroundColor;
    const keywords = (formData.get('keywords') as string) || DEFAULT_FAVICON_METADATA.keywords;

    const metadataObj: FaviconMetadata = {
      appName,
      shortName,
      description,
      themeColor,
      backgroundColor,
      keywords,
    };

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ninguna imagen para generar favicons.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo permitido de 4.5 MB (${sizeMB} MB).` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Validación de imagen válida
    try {
      const metadata = await sharp(inputBuffer).metadata();
      if (!metadata.format) {
        return NextResponse.json(
          { error: 'El archivo no contiene un formato de imagen válido.' },
          { status: 415 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida o está dañado.' },
        { status: 415 }
      );
    }

    // Tamaños estándar de favicons incluyendo favicon.ico, versiones personalizadas y tarjeta OpenGraph
    const iconTargets = [
      { name: 'favicon.ico', width: 32, height: 32 },
      { name: `${customName}-16x16.png`, width: 16, height: 16 },
      { name: `${customName}-32x32.png`, width: 32, height: 32 },
      { name: 'apple-touch-icon.png', width: 180, height: 180 },
      { name: 'android-chrome-192x192.png', width: 192, height: 192 },
      { name: 'android-chrome-512x512.png', width: 512, height: 512 },
      { name: 'og-image.png', width: 1200, height: 630 },
    ];

    const results: { name: string; size: number; width: number; height: number; base64: string }[] = [];

    for (const item of iconTargets) {
      const resizedBuffer = await sharp(inputBuffer)
        .resize(item.width, item.height, { fit: 'cover', position: 'center' })
        .png({ quality: 90 })
        .toBuffer();

      results.push({
        name: item.name,
        size: item.width,
        width: item.width,
        height: item.height,
        base64: resizedBuffer.toString('base64'),
      });
    }

    const manifestContent = generateWebManifest(metadataObj, results);
    const headSnippet = generateHeadSnippet(metadataObj, customName);

    return NextResponse.json({
      success: true,
      originalName: file.name,
      icons: results,
      manifest: manifestContent,
      headSnippet,
      metadata: metadataObj,
    });
  } catch (error: unknown) {
    console.error('Error generando favicons:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar los favicons.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

