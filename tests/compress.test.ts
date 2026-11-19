import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
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

  it('debe exportar a formatos especiales / raros (TIFF y GIF) correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    // Test TIFF
    const formTiff = new FormData();
    formTiff.append('file', blob, 'websling_logo.png');
    formTiff.append('format', 'tiff');
    const reqTiff = new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formTiff });
    const resTiff = await compressHandler(reqTiff);
    expect(resTiff.status).toBe(200);
    const jsonTiff = await resTiff.json();
    expect(jsonTiff.success).toBe(true);
    expect(jsonTiff.formatApplied).toBe('TIFF');
    expect(jsonTiff.outputFileName).toContain('.tiff');

    // Test GIF
    const formGif = new FormData();
    formGif.append('file', blob, 'websling_logo.png');
    formGif.append('format', 'gif');
    const reqGif = new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formGif });
    const resGif = await compressHandler(reqGif);
    expect(resGif.status).toBe(200);
    const jsonGif = await resGif.json();
    expect(jsonGif.success).toBe(true);
    expect(jsonGif.formatApplied).toBe('GIF');
    expect(jsonGif.outputFileName).toContain('.gif');
  });

  it('debe soportar modo contain (relleno con bordes / blur background) para historias verticales sin perder contenido', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    // Test Contain con Desenfoque Pro (Blur)
    const formBlur = new FormData();
    formBlur.append('file', blob, 'horizontal.png');
    formBlur.append('resizeMode', 'custom');
    formBlur.append('maxWidth', '1080');
    formBlur.append('maxHeight', '1920');
    formBlur.append('cropFit', 'contain');
    formBlur.append('containBackground', 'blur');
    formBlur.append('format', 'webp');

    const reqBlur = new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formBlur });
    const resBlur = await compressHandler(reqBlur);
    expect(resBlur.status).toBe(200);
    const jsonBlur = await resBlur.json();
    expect(jsonBlur.success).toBe(true);
    expect(jsonBlur.finalWidth).toBe(1080);
    expect(jsonBlur.finalHeight).toBe(1920);

    // Test Contain con Fondo Negro
    const formBlack = new FormData();
    formBlack.append('file', blob, 'horizontal.png');
    formBlack.append('resizeMode', 'custom');
    formBlack.append('maxWidth', '1080');
    formBlack.append('maxHeight', '1920');
    formBlack.append('cropFit', 'contain');
    formBlack.append('containBackground', 'black');
    formBlack.append('format', 'jpg');

    const reqBlack = new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formBlack });
    const resBlack = await compressHandler(reqBlack);
    expect(resBlack.status).toBe(200);
    const jsonBlack = await resBlack.json();
    expect(jsonBlack.success).toBe(true);
    expect(jsonBlack.finalWidth).toBe(1080);
    expect(jsonBlack.finalHeight).toBe(1920);

    // Test con BorderPadding (15%) y Color Personalizado Hex (#111522)
    const formPadding = new FormData();
    formPadding.append('file', blob, 'horizontal.png');
    formPadding.append('resizeMode', 'custom');
    formPadding.append('maxWidth', '800');
    formPadding.append('maxHeight', '800');
    formPadding.append('cropFit', 'contain');
    formPadding.append('cropPosition', 'top');
    formPadding.append('borderPadding', '15');
    formPadding.append('containBackground', '#111522');
    formPadding.append('format', 'png');

    const reqPadding = new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formPadding });
    const resPadding = await compressHandler(reqPadding);
    expect(resPadding.status).toBe(200);
    const jsonPadding = await resPadding.json();
    expect(jsonPadding.success).toBe(true);
    expect(jsonPadding.finalWidth).toBe(800);
    expect(jsonPadding.finalHeight).toBe(800);
  });

  it('convierte un SVG a PNG y conserva un SVG de origen sin rasterizarlo', async () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40">
  <rect width="80" height="40" fill="#e62429"/>
  <script>alert('x')</script>
</svg>`;
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });

    const toPng = new FormData();
    toPng.append('file', svgBlob, 'logo.svg');
    toPng.append('format', 'png');
    toPng.append('preserveQuality', 'true');
    const pngRes = await compressHandler(new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: toPng }));
    expect(pngRes.status).toBe(200);
    const pngJson = await pngRes.json();
    expect(pngJson.formatApplied).toBe('PNG');
    expect(pngJson.finalWidth).toBe(80);
    expect(pngJson.finalHeight).toBe(40);
    expect(pngJson.mimeType).toBe('image/png');

    const keepSvg = new FormData();
    keepSvg.append('file', svgBlob, 'logo.svg');
    keepSvg.append('format', 'svg');
    keepSvg.append('preserveQuality', 'true');
    const svgRes = await compressHandler(new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: keepSvg }));
    expect(svgRes.status).toBe(200);
    const svgJson = await svgRes.json();
    expect(svgJson.formatApplied).toBe('SVG');
    expect(svgJson.svgRender).toBe('source');
    expect(svgJson.outputFileName).toContain('.svg');
    const svgOut = Buffer.from(svgJson.base64Data.split(',')[1], 'base64').toString('utf8');
    expect(svgOut).toContain('<rect');
    expect(svgOut.toLowerCase()).not.toContain('<script');
  });

  it('convierte un raster plano a SVG vectorial y una foto a SVG embebido', async () => {
    const flat = await sharp({
      create: { width: 40, height: 40, channels: 3, background: { r: 255, g: 255, b: 255 } },
    }).composite([{
      input: await sharp({
        create: { width: 16, height: 16, channels: 3, background: { r: 0, g: 0, b: 0 } },
      }).png().toBuffer(),
      left: 12,
      top: 12,
    }]).png().toBuffer();

    const vectorForm = new FormData();
    vectorForm.append('file', new Blob([flat], { type: 'image/png' }), 'icono.png');
    vectorForm.append('format', 'svg');
    vectorForm.append('svgMode', 'vector');
    vectorForm.append('preserveQuality', 'true');
    const vectorRes = await compressHandler(new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: vectorForm }));
    expect(vectorRes.status).toBe(200);
    const vectorJson = await vectorRes.json();
    expect(vectorJson.formatApplied).toBe('SVG');
    expect(vectorJson.svgRender).toBe('vector');
    const vectorSvg = Buffer.from(vectorJson.base64Data.split(',')[1], 'base64').toString('utf8');
    expect(vectorSvg).toContain('<path');
    expect(vectorJson.finalWidth).toBe(40);
    expect(vectorJson.finalHeight).toBe(40);

    const width = 48;
    const height = 48;
    const raw = Buffer.alloc(width * height * 3);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        raw[i] = Math.round((x / width) * 255);
        raw[i + 1] = Math.round((y / height) * 255);
        raw[i + 2] = 80;
      }
    }
    const photo = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
    const embedForm = new FormData();
    embedForm.append('file', new Blob([photo], { type: 'image/png' }), 'foto.png');
    embedForm.append('format', 'svg');
    embedForm.append('svgMode', 'embed');
    embedForm.append('preserveQuality', 'true');
    const embedRes = await compressHandler(new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: embedForm }));
    expect(embedRes.status).toBe(200);
    const embedJson = await embedRes.json();
    expect(embedJson.formatApplied).toBe('SVG');
    expect(embedJson.svgRender).toBe('embed');
    const embedSvg = Buffer.from(embedJson.base64Data.split(',')[1], 'base64').toString('utf8');
    expect(embedSvg).toContain('<image');
    expect(embedSvg).toContain('data:image/png;base64,');
  });

  it('exporta una versión en blanco y negro con canales iguales', async () => {
    const color = await sharp({
      create: { width: 24, height: 24, channels: 3, background: { r: 220, g: 30, b: 40 } },
    }).png().toBuffer();

    const formData = new FormData();
    formData.append('file', new Blob([color], { type: 'image/png' }), 'color.png');
    formData.append('format', 'png');
    formData.append('grayscale', 'true');
    formData.append('preserveQuality', 'true');

    const res = await compressHandler(new NextRequest('http://localhost:3000/api/compress', { method: 'POST', body: formData }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.monochrome).toBe(true);
    expect(json.formatApplied).toBe('PNG');

    const out = Buffer.from(json.base64Data.split(',')[1], 'base64');
    const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBe(24);
    const r = data[0];
    const g = data[1];
    const b = data[2];
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBeGreaterThan(10);
    expect(r).toBeLessThan(250);
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
