import { NextRequest, NextResponse } from 'next/server';
import { extractImageMetadata } from '../../../utils/metadataExtractor';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se subió ningún archivo para análisis de metadatos.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const metadata = await extractImageMetadata(arrayBuffer, file.name, file.size);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      metadata,
    });
  } catch (error: unknown) {
    console.error('Error al extraer metadatos:', error);
    const message = error instanceof Error ? error.message : 'Error inesperado al extraer metadatos.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
