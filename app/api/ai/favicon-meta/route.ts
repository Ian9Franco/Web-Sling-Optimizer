import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const base64Input = formData.get('base64Data') as string | null;
    const provider = (formData.get('provider') as string) || 'gemini';
    const apiKey = (formData.get('apiKey') as string) || '';
    const model = (formData.get('model') as string) || (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    const customContext = (formData.get('customContext') as string) || '';
    const language = (formData.get('language') as string) || 'es';

    if (!apiKey || apiKey.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Se requiere una API Key válida. Configúrala en el botón ✨ IA.' },
        { status: 400 }
      );
    }

    let inputBuffer: Buffer;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      inputBuffer = Buffer.from(arrayBuffer);
    } else if (base64Input) {
      const cleanBase64 = base64Input.replace(/^data:image\/\w+;base64,/, '');
      inputBuffer = Buffer.from(cleanBase64, 'base64');
    } else {
      return NextResponse.json({ success: false, error: 'No se envió ninguna imagen.' }, { status: 400 });
    }

    // Generar thumbnail optimizado para análisis visual
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64Data = thumbnailBuffer.toString('base64');
    const langName = language === 'en' ? 'English' : 'Spanish';

    const prompt = `You are an expert in Web Branding, PWA (Progressive Web App) Manifests, and Design Color Theory.
Analyze this logo / icon image and extract/generate branding and SEO metadata.

Requirements:
1. "appName": Suggested brand or application name based on visible text in the logo or visual theme (concise, 1-4 words).
2. "shortName": Short mobile app title for PWA home screen tiles (maximum 12 characters).
3. "description": A compelling, professional SEO meta description in ${langName} (around 50-140 characters).
4. "themeColor": The primary vibrant brand/accent color extracted directly from the logo in 6-character hex format with '#' (e.g., "#2563eb", "#e62429", "#10b981").
5. "backgroundColor": A clean complementary dark or light background hex color suitable for PWA splash screens (e.g., "#090b10", "#0f172a", or "#ffffff").
6. "keywords": 4-6 comma-separated relevant SEO keywords in ${langName}.
${customContext ? `Additional Business Context: "${customContext}". Incorporate this context naturally.` : ''}

Respond ONLY with valid JSON in this exact structure:
{
  "appName": "Brand Name",
  "shortName": "ShortName",
  "description": "Engaging description of the web application.",
  "themeColor": "#2563eb",
  "backgroundColor": "#090b10",
  "keywords": "keyword1, keyword2, keyword3"
}`;

    let resultJson: {
      appName?: string;
      shortName?: string;
      description?: string;
      themeColor?: string;
      backgroundColor?: string;
      keywords?: string;
    } = {};

    if (provider === 'gemini') {
      const cleanModel = model.replace(/^models\//, '');
      const candidateModels = Array.from(new Set([
        cleanModel,
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
      ]));

      const apiVersions = ['v1beta', 'v1'];
      let lastError = '';
      let success = false;

      outerLoop:
      for (const apiVer of apiVersions) {
        for (const candidate of candidateModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/${apiVer}/models/${candidate}:generateContent?key=${apiKey}`;
            const response = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inline_data: {
                          mime_type: 'image/jpeg',
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  response_mime_type: 'application/json',
                },
              }),
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              lastError = errData?.error?.message || `Error de Gemini (${response.status})`;
              if (
                response.status === 404 ||
                lastError.toLowerCase().includes('not found') ||
                lastError.toLowerCase().includes('no longer available') ||
                lastError.toLowerCase().includes('not supported')
              ) {
                continue;
              }
              return NextResponse.json({ success: false, error: lastError }, { status: response.status });
            }

            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            try {
              resultJson = JSON.parse(rawText);
            } catch {
              const match = rawText.match(/\{[\s\S]*\}/);
              if (match) resultJson = JSON.parse(match[0]);
            }
            success = true;
            break outerLoop;
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Error conectando con Gemini';
          }
        }
      }

      if (!success) {
        return NextResponse.json(
          { success: false, error: lastError || 'No se pudo conectar con los modelos de Gemini disponibles.' },
          { status: 400 }
        );
      }
    } else {
      // Endpoint de OpenAI
      const openAiUrl = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(openAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `Error de OpenAI (${response.status})`;
        return NextResponse.json({ success: false, error: errMsg }, { status: response.status });
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '{}';
      try {
        resultJson = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) resultJson = JSON.parse(match[0]);
      }
    }

    // Normalizar respuestas y colores hexadecimales
    const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
    const themeColor = hexColorRegex.test(resultJson.themeColor || '') ? resultJson.themeColor! : '#2563eb';
    const backgroundColor = hexColorRegex.test(resultJson.backgroundColor || '') ? resultJson.backgroundColor! : '#090b10';

    return NextResponse.json({
      success: true,
      metadata: {
        appName: resultJson.appName?.trim() || 'Mi Aplicación Web',
        shortName: resultJson.shortName?.trim() || 'App',
        description: resultJson.description?.trim() || 'Sitio web y aplicación optimizada para alto rendimiento.',
        themeColor,
        backgroundColor,
        keywords: resultJson.keywords?.trim() || 'web, app, pwa, fast',
      },
    });
  } catch (error: unknown) {
    console.error('Error en /api/ai/favicon-meta:', error);
    const msg = error instanceof Error ? error.message : 'Error interno procesando metadatos con IA.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
