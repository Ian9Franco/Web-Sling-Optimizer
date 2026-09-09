import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { POST as metadataHandler } from '../app/api/metadata/route';
import { extractImageMetadata, detectAiOrigin } from '../utils/metadataExtractor';

describe('Metadata & AI Detection Engine', () => {
  it('debe extraer metadatos técnicos de public/1.jpeg correctamente', async () => {
    const imagePath = path.join(process.cwd(), 'public', '1.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);

    const meta = await extractImageMetadata(imageBuffer, '1.jpeg', imageBuffer.length);
    expect(meta).toBeDefined();
    expect(meta.technical.format).toBe('JPEG');
    expect(meta.technical.hasIccProfile).toBe(true);
    expect(meta.technical.profileCopyright).toContain('Google');
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
    const imagePath = path.join(process.cwd(), 'public', '1.jpeg');
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', blob, '1.jpeg');

    const req = new NextRequest('http://localhost:3000/api/metadata', {
      method: 'POST',
      body: formData,
    });

    const res = await metadataHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.metadata.technical.format).toBe('JPEG');
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
});
