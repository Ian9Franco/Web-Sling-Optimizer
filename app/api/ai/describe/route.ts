import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { slugify } from '../../../../utils/naming';

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
    const originalName = (formData.get('originalName') as string) || 'image.jpg';

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

    // Generar thumbnail ultraliviano (512px JPEG) para minimizar tokens y latencia
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64Data = thumbnailBuffer.toString('base64');

    // Extension original o .webp si no tiene
    const dotIdx = originalName.lastIndexOf('.');
    const ext = dotIdx !== -1 ? originalName.substring(dotIdx) : '.webp';

    const langName = language === 'en' ? 'English' : 'Spanish';
    const prompt = `You are an expert in Web Image SEO and Accessibility.
Analyze this image and generate an optimal SEO filename and descriptive ALT text.

Requirements:
1. "fileName": A concise, descriptive filename in kebab-case (lowercase, words separated by hyphens, no accents or special characters, ending with "${ext}").
2. "altText": An accessible, natural, concise alternative text for screen readers and SEO (around 40 to 120 characters in ${langName}). Accurately describe the key object, context, or visual subject.
${customContext ? `Brand / Business Context: "${customContext}". Incorporate relevant context naturally without keyword stuffing.` : ''}

Respond ONLY with valid JSON in this exact structure:
{
  "fileName": "example-descriptive-name${ext}",
  "altText": "Descriptive alt text in ${langName}"
}`;

    let resultJson: { fileName?: string; altText?: string } = {};

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

      // Intentar primero con los candidatos directos en v1beta y v1
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

      // Si todos los nombres predefinidos fallaron por 404, consultar ModelService.ListModels dinámicamente
      if (!success) {
        for (const apiVer of apiVersions) {
          try {
            const listUrl = `https://generativelanguage.googleapis.com/${apiVer}/models?key=${apiKey}`;
            const listRes = await fetch(listUrl);
            if (listRes.ok) {
              const listData = await listRes.json();
              const available = (listData?.models || [])
                .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => m.name.replace(/^models\//, ''));

              // Priorizar modelos flash o visión
              const preferred = available.find((m: string) => m.includes('flash')) || available[0];
              if (preferred) {
                const geminiUrl = `https://generativelanguage.googleapis.com/${apiVer}/models/${preferred}:generateContent?key=${apiKey}`;
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

                if (response.ok) {
                  const data = await response.json();
                  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                  try {
                    resultJson = JSON.parse(rawText);
                  } catch {
                    const match = rawText.match(/\{[\s\S]*\}/);
                    if (match) resultJson = JSON.parse(match[0]);
                  }
                  success = true;
                  break;
                }
              }
            }
          } catch {
            // Continuar con el error original
          }
        }
      }

      if (!success) {
        return NextResponse.json({ success: false, error: lastError || 'No se pudo conectar con los modelos de Gemini disponibles para esta API Key.' }, { status: 400 });
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

    // Normalizar y validar fileName
    let finalFileName = resultJson.fileName || originalName;
    const finalExtMatch = finalFileName.lastIndexOf('.');
    const finalExt = finalExtMatch !== -1 ? finalFileName.substring(finalExtMatch) : ext;
    const baseSlug = finalExtMatch !== -1 ? finalFileName.substring(0, finalExtMatch) : finalFileName;
    const cleanSlug = slugify(baseSlug) || 'image';
    finalFileName = `${cleanSlug}${finalExt}`;

    const finalAltText = resultJson.altText?.trim() || cleanSlug.replace(/-/g, ' ');

    return NextResponse.json({
      success: true,
      fileName: finalFileName,
      altText: finalAltText,
    });
  } catch (error: unknown) {
    console.error('Error en /api/ai/describe:', error);
    const msg = error instanceof Error ? error.message : 'Error interno procesando análisis con IA.';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
