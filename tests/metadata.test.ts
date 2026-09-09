import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { POST as metadataHandler } from '../app/api/metadata/route';
import { extractImageMetadata, detectAiOrigin } from '../utils/metadataExtractor';

describe('Metadata & AI Detection Engine', () => {
  it('debe extraer metadatos técnicos de websling_logo.png correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);

    const meta = await extractImageMetadata(imageBuffer, 'websling_logo.png', imageBuffer.length);
    expect(meta).toBeDefined();
    expect(meta.technical.format).toBe('PNG');
    expect(meta.aiDetection.isAiGenerated).toBe(false);
  });

  it('debe responder 400 en /api/metadata si no se envía archivo', async () => {
    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/metadata', {
      method: 'POST',
      body: formData,
    });

    const res = await metadataHandler(req);
    expect(res.status).toBe(400);
  });

  it('debe procesar /api/metadata con archivo correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', 'websling_logo.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', blob, 'websling_logo.png');

    const req = new NextRequest('http://localhost:3000/api/metadata', {
      method: 'POST',
      body: formData,
    });

    const res = await metadataHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.metadata.technical.format).toBe('PNG');
  });

  it('debe detectar parámetros de Stable Diffusion / Automatic1111', () => {
    const sdParameters = `cyberpunk street vendor at night, neon lights, rainy reflection
Negative prompt: low quality, blurry, deformed, extra limbs
Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7.5, Seed: 123456789, Size: 512x768, Model hash: cc6f68cc, Model: dreamshaper_8`;

    const aiRes = detectAiOrigin({}, { parameters: sdParameters });
    expect(aiRes.isAiGenerated).toBe(true);
    expect(aiRes.generator).toContain('Stable Diffusion');
    expect(aiRes.prompt).toBe('cyberpunk street vendor at night, neon lights, rainy reflection');
    expect(aiRes.negativePrompt).toBe('low quality, blurry, deformed, extra limbs');
    expect(aiRes.steps).toBe(30);
    expect(aiRes.sampler).toBe('DPM++ 2M Karras');
    expect(aiRes.cfgScale).toBe(7.5);
    expect(aiRes.seed).toBe('123456789');
    expect(aiRes.model).toContain('dreamshaper_8');
  });

  it('debe detectar metadatos de Midjourney y DALL-E', () => {
    const mjRes = detectAiOrigin({ ImageDescription: 'futuristic glass skyscraper --v 6.0 --ar 16:9 --stylize 250' }, {});
    expect(mjRes.isAiGenerated).toBe(true);
    expect(mjRes.generator).toBe('Midjourney');

    const dalleRes = detectAiOrigin({ Software: 'DALL-E 3', description: 'isometric view of a cozy coffee shop' }, {});
    expect(dalleRes.isAiGenerated).toBe(true);
    expect(dalleRes.generator).toBe('DALL-E 3');
  });

  it('debe detectar la imagen real de Gemini por su firma C2PA/SynthID', async () => {
    const geminiPath = path.join(process.cwd(), 'public', 'Gemini_Generated_Image_p3h7unp3h7unp3h7.jpg');
    if (fs.existsSync(geminiPath)) {
      const buf = fs.readFileSync(geminiPath);
      // Probamos incluso pasando un nombre neutral para comprobar que NO depende del título
      const meta = await extractImageMetadata(buf, 'foto_anonima_sin_nombre.jpg', buf.length);
      expect(meta.aiDetection.isAiGenerated).toBe(true);
      expect(meta.aiDetection.generator).toContain('Google Gemini');
      expect(meta.aiDetection.confidence).toBe('high');
      expect(meta.aiDetection.additionalDetails?.issuer).toContain('Google');
    }
  });

  it('debe detectar la imagen real de ChatGPT por su manifiesto C2PA IPTC trainedAlgorithmicMedia', async () => {
    const chatGptPath = path.join(process.cwd(), 'public', 'ChatGPT Image 9 sept 2026, 13_58_23.png');
    if (fs.existsSync(chatGptPath)) {
      const buf = fs.readFileSync(chatGptPath);
      // Probamos con nombre genérico para asegurar detección 100% binaria
      const meta = await extractImageMetadata(buf, 'archivo_desconocido.png', buf.length);
      expect(meta.aiDetection.isAiGenerated).toBe(true);
      expect(meta.aiDetection.generator).toContain('OpenAI ChatGPT');
      expect(meta.aiDetection.confidence).toBe('high');
      expect(meta.aiDetection.additionalDetails?.issuer).toContain('OpenAI');
    }
  });

  it('debe identificar que la imagen de WhatsApp no tiene metadatos (recomprimida en tránsito)', async () => {
    const waPath = path.join(process.cwd(), 'public', 'WhatsApp Image 2026-09-09 at 12.49.18.jpeg');
    if (fs.existsSync(waPath)) {
      const buf = fs.readFileSync(waPath);
      const meta = await extractImageMetadata(buf, 'imagen_wa.jpeg', buf.length);
      // WhatsApp destruye todos los metadatos y chunks en tránsito
      expect(meta.aiDetection.isAiGenerated).toBe(false);
      expect(meta.technical.format).toBe('JPEG');
    }
  });
});
