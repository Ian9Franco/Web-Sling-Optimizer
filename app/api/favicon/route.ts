import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Límite de carga serverless (4.5 MB)
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customName = (formData.get('customName') as string || 'favicon').trim().toLowerCase().replace(/\.[^/.]+$/, "");

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

    // Tamaños estándar de favicons incluyendo favicon.ico y versiones personalizadas
    const sizes = [
      { name: 'favicon.ico', size: 32 },
      { name: `${customName}-16x16.png`, size: 16 },
      { name: `${customName}-32x32.png`, size: 32 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
    ];

    const results: { name: string; size: number; base64: string }[] = [];

    for (const item of sizes) {
      const resizedBuffer = await sharp(inputBuffer)
        .resize(item.size, item.size, { fit: 'cover' })
        .png({ quality: 90 })
        .toBuffer();

      results.push({
        name: item.name,
        size: item.size,
        base64: resizedBuffer.toString('base64'),
      });
    }

    const manifestContent = JSON.stringify(
      {
        name: "Mi Aplicación Web",
        short_name: "App",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone"
      },
      null,
      2
    );

    return NextResponse.json({
      success: true,
      originalName: file.name,
      icons: results,
      manifest: manifestContent,
    });
  } catch (error: any) {
    console.error('Error generando favicons:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar los favicons.' },
      { status: 500 }
    );
  }
}
