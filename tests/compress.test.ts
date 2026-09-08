import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { POST as compressHandler } from '../app/api/compress/route';
import { POST as faviconHandler } from '../app/api/favicon/route';

describe('API /api/compress', () => {
  it('debe retornar 400 si no se envía ningún archivo', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('No se ha subido ningún archivo.');
  });

  it('debe retornar 413 si el archivo supera el límite de 4.5 MB', async () => {
    const formData = new FormData();
    // Archivo simulado de 5 MB
    const largeBlob = new Blob([new Uint8Array(5 * 1024 * 1024)], { type: 'image/jpeg' });
    formData.append('file', largeBlob, 'large.jpg');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(413);

    const json = await res.json();
    expect(json.error).toContain('4.5 MB');
  });

  it('debe retornar 415 si el archivo no es una imagen válida o está corrupto', async () => {
    const formData = new FormData();
    const fakeBlob = new Blob(['Este es un archivo de texto disfrazado'], { type: 'image/jpeg' });
    formData.append('file', fakeBlob, 'fake.jpg');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(415);

    const json = await res.json();
    expect(json.error).toContain('no es una imagen válida');
  });

  it('debe comprimir exitosamente y convertir a WebP respetando el límite maxKB', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');
    formData.append('maxKB', '100');
    formData.append('format', 'webp');
    formData.append('watermarkText', 'WebSling Test');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.formatApplied).toBe('WEBP');
    expect(json.compressedSizeBytes).toBeLessThanOrEqual(100 * 1024);
    expect(json.base64Data).toContain('data:image/webp;base64,');
  });

  it('debe aplicar el renombrado por patrones dinámicos correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');
    formData.append('maxKB', '300');
    formData.append('format', 'webp');
    formData.append('customName', '{original}-{width}x{height}-q{quality}');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.outputFileName).toMatch(/^websling_logo-\d+x\d+-q\d+\.webp$/);
  });

  it('debe codificar exactamente a la calidad solicitada cuando se provee el parámetro quality', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');
    formData.append('quality', '75');
    formData.append('format', 'jpg');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.qualityApplied).toBe(75);
    expect(json.formatApplied).toBe('JPG');
  });

  it('debe aplicar Super-Resolución (upscaleFactor 2x) y Claridad HD correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');
    formData.append('upscaleFactor', '2');
    formData.append('clarity', 'true');
    formData.append('format', 'webp');

    const req = new NextRequest('http://localhost:3000/api/compress', {
      method: 'POST',
      body: formData,
    });

    const res = await compressHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.upscaleApplied).toBe(2);
    expect(json.clarityApplied).toBe(true);
    expect(json.finalWidth).toBe(json.originalWidth * 2);
    expect(json.finalHeight).toBe(json.originalHeight * 2);
  });
});

describe('API /api/favicon', () => {
  it('debe retornar 415 si el archivo para favicons no es una imagen válida', async () => {
    const formData = new FormData();
    const fakeBlob = new Blob(['texto plano'], { type: 'image/png' });
    formData.append('file', fakeBlob, 'fake.png');

    const req = new NextRequest('http://localhost:3000/api/favicon', {
      method: 'POST',
      body: formData,
    });

    const res = await faviconHandler(req);
    expect(res.status).toBe(415);
  });

  it('debe generar el paquete de 7 iconos (con OG Card) y el headSnippet correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');
    formData.append('customName', 'test-icon');

    const req = new NextRequest('http://localhost:3000/api/favicon', {
      method: 'POST',
      body: formData,
    });

    const res = await faviconHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.icons).toHaveLength(7);
    expect(json.icons.some((i: { name: string }) => i.name === 'og-image.png')).toBe(true);
    expect(json.icons.some((i: { name: string }) => i.name.includes('test-icon'))).toBe(true);
    expect(json.manifest).toContain('Mi Aplicación Web');
    expect(json.headSnippet).toContain('<link rel="icon"');
    expect(json.headSnippet).toContain('og:image');
  });
});
