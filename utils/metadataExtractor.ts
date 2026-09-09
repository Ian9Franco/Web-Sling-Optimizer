import exifr from 'exifr';
import { ImageMetadataDetails, AiDetectionResult, ExifCameraDetails, IptcRightsDetails, ColorAndTechnicalDetails } from '../types/image';

/**
 * Extrae texto de chunks PNG (tEXt, zTXt, iTXt) directamente del buffer
 */
function extractPngTextChunks(buffer: Uint8Array): Record<string, string> {
  const chunks: Record<string, string> = {};
  if (buffer.length < 8) return chunks;

  // Verificar firma PNG: 137 80 78 71 13 10 26 10
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  if (!isPng) return chunks;

  let offset = 8;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  while (offset + 8 <= buffer.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      buffer[offset + 4],
      buffer[offset + 5],
      buffer[offset + 6],
      buffer[offset + 7]
    );

    const chunkDataOffset = offset + 8;
    const chunkDataEnd = chunkDataOffset + length;

    if (chunkDataEnd > buffer.length) break;

    if (type === 'tEXt') {
      const data = buffer.slice(chunkDataOffset, chunkDataEnd);
      let nullIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIndex = i;
          break;
        }
      }
      if (nullIndex !== -1) {
        const keyword = new TextDecoder('latin1').decode(data.slice(0, nullIndex));
        const text = new TextDecoder('utf-8').decode(data.slice(nullIndex + 1));
        chunks[keyword] = text;
      }
    } else if (type === 'iTXt') {
      const data = buffer.slice(chunkDataOffset, chunkDataEnd);
      let nullIndex = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i] === 0) {
          nullIndex = i;
          break;
        }
      }
      if (nullIndex !== -1) {
        const keyword = new TextDecoder('latin1').decode(data.slice(0, nullIndex));
        let cursor = nullIndex + 3; // saltar compFlag y compMethod
        while (cursor < data.length && data[cursor] !== 0) cursor++;
        cursor++; // saltar langTag null
        while (cursor < data.length && data[cursor] !== 0) cursor++;
        cursor++; // saltar transKey null

        if (cursor <= data.length) {
          try {
            const text = new TextDecoder('utf-8').decode(data.slice(cursor));
            chunks[keyword] = text;
          } catch {
            // Fallback ignorado
          }
        }
      }
    }

    if (type === 'IEND') break;
    offset += 12 + length;
  }

  return chunks;
}

/**
 * Parsea el texto estándar de parámetros de Automatic1111 / WebUI / Stable Diffusion
 */
function parseA1111Parameters(paramStr: string): Partial<AiDetectionResult> {
  const result: Partial<AiDetectionResult> = {
    isAiGenerated: true,
    generator: 'Stable Diffusion (A1111 / WebUI)',
    confidence: 'high',
    rawParams: paramStr,
  };

  let prompt = '';
  let negativePrompt = '';
  let paramsPart = '';

  const negIdx = paramStr.indexOf('Negative prompt:');
  const stepsIdx = paramStr.indexOf('Steps:');

  if (negIdx !== -1) {
    prompt = paramStr.substring(0, negIdx).trim();
    if (stepsIdx !== -1 && stepsIdx > negIdx) {
      negativePrompt = paramStr.substring(negIdx + 'Negative prompt:'.length, stepsIdx).trim();
      paramsPart = paramStr.substring(stepsIdx).trim();
    } else {
      negativePrompt = paramStr.substring(negIdx + 'Negative prompt:'.length).trim();
    }
  } else if (stepsIdx !== -1) {
    prompt = paramStr.substring(0, stepsIdx).trim();
    paramsPart = paramStr.substring(stepsIdx).trim();
  } else {
    prompt = paramStr.trim();
  }

  result.prompt = prompt;
  if (negativePrompt) result.negativePrompt = negativePrompt;

  if (paramsPart) {
    const stepsMatch = paramsPart.match(/Steps:\s*(\d+)/i);
    if (stepsMatch) result.steps = parseInt(stepsMatch[1], 10);

    const samplerMatch = paramsPart.match(/Sampler:\s*([^,]+)/i);
    if (samplerMatch) result.sampler = samplerMatch[1].trim();

    const cfgMatch = paramsPart.match(/CFG scale:\s*([\d.]+)/i);
    if (cfgMatch) result.cfgScale = parseFloat(cfgMatch[1]);

    const seedMatch = paramsPart.match(/Seed:\s*(\d+)/i);
    if (seedMatch) result.seed = seedMatch[1].trim();

    const modelMatch = paramsPart.match(/Model:\s*([^,]+)/i);
    if (modelMatch) result.model = modelMatch[1].trim();

    const hashMatch = paramsPart.match(/Model hash:\s*([^,]+)/i);
    if (hashMatch && result.model) {
      result.model = `${result.model} (${hashMatch[1].trim()})`;
    }
  }

  return result;
}

/**
 * Parsea el JSON de workflow / prompt de ComfyUI
 */
function parseComfyUiWorkflow(promptJsonStr: string, workflowJsonStr?: string): Partial<AiDetectionResult> {
  const result: Partial<AiDetectionResult> = {
    isAiGenerated: true,
    generator: 'ComfyUI',
    confidence: 'high',
    workflowJson: workflowJsonStr || promptJsonStr,
  };

  try {
    const promptData = JSON.parse(promptJsonStr);
    const positivePrompts: string[] = [];
    const negativePrompts: string[] = [];
    const models: string[] = [];
    let seed: string | number | undefined;
    let steps: number | undefined;
    let sampler: string | undefined;
    let cfg: number | undefined;

    for (const key of Object.keys(promptData)) {
      const node = promptData[key];
      const classType = node?.class_type || '';
      const inputs = node?.inputs || {};

      if (classType.includes('CLIPTextEncode')) {
        const text = inputs.text;
        if (typeof text === 'string' && text.trim()) {
          const title = (node?._meta?.title || '').toLowerCase();
          if (title.includes('negative') || title.includes('neg')) {
            negativePrompts.push(text.trim());
          } else {
            positivePrompts.push(text.trim());
          }
        }
      }

      if (classType.includes('KSampler')) {
        if (inputs.seed !== undefined) seed = inputs.seed;
        if (inputs.steps !== undefined) steps = parseInt(inputs.steps, 10);
        if (inputs.cfg !== undefined) cfg = parseFloat(inputs.cfg);
        if (inputs.sampler_name !== undefined) sampler = inputs.sampler_name;
      }

      if (classType.includes('CheckpointLoader') && inputs.ckpt_name) {
        models.push(inputs.ckpt_name);
      }
    }

    if (positivePrompts.length > 0) result.prompt = positivePrompts.join('\n\n');
    if (negativePrompts.length > 0) result.negativePrompt = negativePrompts.join('\n\n');
    if (models.length > 0) result.model = models.join(', ');
    if (seed !== undefined) result.seed = seed;
    if (steps !== undefined) result.steps = steps;
    if (sampler) result.sampler = sampler;
    if (cfg !== undefined) result.cfgScale = cfg;
  } catch {
    result.rawParams = promptJsonStr;
  }

  return result;
}

/**
 * Motor Heurístico Central de Detección de Origen IA
 */
export function detectAiOrigin(
  rawTags: Record<string, any>,
  pngChunks: Record<string, string>,
  fileName?: string
): AiDetectionResult {
  // 1. Chunks PNG: A1111 / SD
  if (pngChunks.parameters) {
    const a1111 = parseA1111Parameters(pngChunks.parameters);
    return {
      isAiGenerated: true,
      generator: a1111.generator || 'Stable Diffusion',
      confidence: 'high',
      ...a1111,
    };
  }

  // 2. ComfyUI en PNG chunks
  if (pngChunks.prompt || pngChunks.workflow) {
    const comfy = parseComfyUiWorkflow(pngChunks.prompt || '{}', pngChunks.workflow);
    return {
      isAiGenerated: true,
      generator: 'ComfyUI',
      confidence: 'high',
      ...comfy,
    };
  }

  // 3. NovelAI en PNG chunks
  if (pngChunks.Software === 'NovelAI' || pngChunks.Title === 'NovelAI' || (pngChunks.Comment && pngChunks.Comment.includes('"steps":'))) {
    let prompt = pngChunks.Description || pngChunks.Comment || '';
    let seed: string | undefined;
    let steps: number | undefined;
    try {
      if (pngChunks.Comment && pngChunks.Comment.startsWith('{')) {
        const commentObj = JSON.parse(pngChunks.Comment);
        if (commentObj.prompt) prompt = commentObj.prompt;
        if (commentObj.seed) seed = commentObj.seed;
        if (commentObj.steps) steps = commentObj.steps;
      }
    } catch {
      // Ignorar fallback
    }

    return {
      isAiGenerated: true,
      generator: 'NovelAI',
      confidence: 'high',
      prompt: prompt || undefined,
      seed,
      steps,
      rawParams: pngChunks.Comment || pngChunks.Description,
    };
  }

  // 4. Buscar en Tags EXIF / XMP / IPTC
  const userComment = typeof rawTags.UserComment === 'string' ? rawTags.UserComment : '';
  const imageDesc = typeof rawTags.ImageDescription === 'string' ? rawTags.ImageDescription : '';
  const description = typeof rawTags.description === 'string' ? rawTags.description : '';
  const software = typeof rawTags.Software === 'string' ? rawTags.Software : (typeof rawTags.CreatorTool === 'string' ? rawTags.CreatorTool : '');
  const digitalSource = typeof rawTags.DigitalSourceType === 'string' ? rawTags.DigitalSourceType : '';
  const comment = typeof rawTags.Comment === 'string' ? rawTags.Comment : '';

  const allStrings = [userComment, imageDesc, description, comment, software].filter(Boolean);
  const combinedText = allStrings.join('\n');

  // 4a. A1111 en UserComment / ImageDescription (JPEG / WebP)
  if (/Steps:\s*\d+/i.test(combinedText) && /Sampler:\s*/i.test(combinedText)) {
    const matchedText = [userComment, imageDesc, description, comment].find(s => /Steps:\s*\d+/i.test(s)) || combinedText;
    const a1111 = parseA1111Parameters(matchedText);
    return {
      isAiGenerated: true,
      generator: 'Stable Diffusion',
      confidence: 'high',
      ...a1111,
    };
  }

  // 4b. Midjourney
  if (
    /midjourney/i.test(combinedText) ||
    /--v\s+[4-7]/i.test(combinedText) ||
    /--ar\s+\d+:\d+/i.test(combinedText) ||
    /--stylize\s+\d+/i.test(combinedText) ||
    (fileName && /midjourney/i.test(fileName))
  ) {
    const promptText = combinedText.replace(/midjourney/gi, '').trim();
    return {
      isAiGenerated: true,
      generator: 'Midjourney',
      confidence: /midjourney/i.test(combinedText) || /--v\s+[4-7]/i.test(combinedText) ? 'high' : 'medium',
      prompt: promptText || imageDesc || description || undefined,
      rawParams: combinedText,
    };
  }

  // 4c. DALL-E / OpenAI / Bing Image Creator
  if (/dall-e/i.test(combinedText) || /openai/i.test(combinedText) || /bing image creator/i.test(combinedText)) {
    return {
      isAiGenerated: true,
      generator: /dall-e\s*3/i.test(combinedText) ? 'DALL-E 3' : 'DALL-E',
      confidence: 'high',
      prompt: imageDesc || description || undefined,
      rawParams: combinedText,
    };
  }

  // 4d. Adobe Firefly
  if (/adobe firefly/i.test(combinedText) || /firefly/i.test(software)) {
    return {
      isAiGenerated: true,
      generator: 'Adobe Firefly',
      confidence: 'high',
      prompt: imageDesc || description || undefined,
      rawParams: combinedText,
    };
  }

  // 4e. IPTC Standard / C2PA trainedAlgorithmicMedia / synthetic
  if (
    /trainedAlgorithmicMedia/i.test(digitalSource) ||
    /compositeSynthetic/i.test(digitalSource) ||
    /syntheticMedia/i.test(digitalSource)
  ) {
    return {
      isAiGenerated: true,
      generator: 'Synthetic Media (C2PA / IPTC Standard)',
      confidence: 'high',
      prompt: imageDesc || description || undefined,
      additionalDetails: { digitalSourceType: digitalSource },
      rawParams: combinedText,
    };
  }

  // 5. No se detectó origen IA
  return {
    isAiGenerated: false,
    confidence: 'none',
  };
}

/**
 * Función principal para extraer metadatos estructurados completos de cualquier imagen
 */
export async function extractImageMetadata(
  input: ArrayBuffer | Uint8Array | Buffer | Blob,
  fileName?: string,
  fileSizeBytes?: number
): Promise<ImageMetadataDetails> {
  let uint8: Uint8Array;

  if (input instanceof Uint8Array) {
    uint8 = input;
  } else if (input instanceof ArrayBuffer) {
    uint8 = new Uint8Array(input);
  } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
    const ab = await input.arrayBuffer();
    uint8 = new Uint8Array(ab);
  } else {
    uint8 = new Uint8Array(input as any);
  }

  const effectiveSize = fileSizeBytes || uint8.byteLength;

  // Extraer chunks PNG
  const pngChunks = extractPngTextChunks(uint8);

  // Parsear con exifr todas las secciones de metadatos disponibles
  let parsedRaw: Record<string, any> = {};
  let parsedMulti: any = {};

  try {
    parsedMulti = await exifr.parse(uint8, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      mergeOutput: false,
      reviveValues: true,
    }) || {};

    parsedRaw = {
      ...(parsedMulti.jfif || {}),
      ...(parsedMulti.tiff || {}),
      ...(parsedMulti.exif || {}),
      ...(parsedMulti.gps || {}),
      ...(parsedMulti.iptc || {}),
      ...(parsedMulti.xmp || {}),
      ...(parsedMulti.icc || {}),
      ...pngChunks,
    };
  } catch (e) {
    console.warn('Error leyendo exifr:', e);
  }

  // Detectar IA
  const aiDetection = detectAiOrigin(parsedRaw, pngChunks, fileName);

  // Extraer datos de Cámara / EXIF
  let camera: ExifCameraDetails | undefined = undefined;
  const make = parsedRaw.Make || parsedRaw.make;
  const model = parsedRaw.Model || parsedRaw.model;
  const lens = parsedRaw.LensModel || parsedRaw.Lens || parsedRaw.lens;
  const iso = parsedRaw.ISO || parsedRaw.PhotographicSensitivity || parsedRaw.iso;
  const fNumber = parsedRaw.FNumber || parsedRaw.fNumber;
  const exposureTime = parsedRaw.ExposureTime || parsedRaw.exposureTime;
  const focalLength = parsedRaw.FocalLength || parsedRaw.focalLength;
  const dateTimeOriginal = parsedRaw.DateTimeOriginal ? new Date(parsedRaw.DateTimeOriginal).toISOString() : undefined;
  const software = parsedRaw.Software || parsedRaw.CreatorTool || parsedRaw.software;

  if (make || model || lens || iso || fNumber || exposureTime || focalLength || dateTimeOriginal || software) {
    camera = {
      make: typeof make === 'string' ? make.trim() : undefined,
      model: typeof model === 'string' ? model.trim() : undefined,
      lens: typeof lens === 'string' ? lens.trim() : undefined,
      software: typeof software === 'string' ? software.trim() : undefined,
      iso: typeof iso === 'number' ? iso : undefined,
      fNumber: typeof fNumber === 'number' ? fNumber : undefined,
      exposureTime: typeof exposureTime === 'number' ? `1/${Math.round(1 / exposureTime)}s` : exposureTime,
      focalLength: typeof focalLength === 'number' ? Math.round(focalLength) : undefined,
      dateTimeOriginal,
      gpsLatitude: typeof parsedRaw.latitude === 'number' ? parsedRaw.latitude : undefined,
      gpsLongitude: typeof parsedRaw.longitude === 'number' ? parsedRaw.longitude : undefined,
      whiteBalance: parsedRaw.WhiteBalance ? String(parsedRaw.WhiteBalance) : undefined,
      flash: parsedRaw.Flash ? String(parsedRaw.Flash) : undefined,
    };
  }

  // Extraer datos de Derechos / IPTC
  let rights: IptcRightsDetails | undefined = undefined;
  const title = parsedRaw.ObjectName || parsedRaw.title || parsedRaw.Title;
  const creator = parsedRaw.Byline || parsedRaw.creator || parsedRaw.Artist || parsedRaw.Creator;
  const credit = parsedRaw.Credit || parsedRaw.credit;
  const copyright = parsedRaw.Copyright || parsedRaw.copyright || parsedRaw.ProfileCopyright;
  const caption = parsedRaw.Caption || parsedRaw.description || parsedRaw.ImageDescription;
  const keywords = Array.isArray(parsedRaw.Keywords) ? parsedRaw.Keywords : (typeof parsedRaw.Keywords === 'string' ? [parsedRaw.Keywords] : undefined);
  const digitalSourceType = parsedRaw.DigitalSourceType || parsedRaw.digitalSourceType;

  if (title || creator || credit || copyright || caption || keywords || digitalSourceType) {
    rights = {
      title: typeof title === 'string' ? title.trim() : undefined,
      creator: typeof creator === 'string' ? creator.trim() : undefined,
      credit: typeof credit === 'string' ? credit.trim() : undefined,
      copyright: typeof copyright === 'string' ? copyright.trim() : undefined,
      caption: typeof caption === 'string' ? caption.trim() : undefined,
      keywords,
      digitalSourceType: typeof digitalSourceType === 'string' ? digitalSourceType.trim() : undefined,
    };
  }

  // Extraer datos Técnicos y Perfil de Color
  const icc = parsedMulti.icc || {};
  const jfif = parsedMulti.jfif || {};
  const tiff = parsedMulti.tiff || {};

  const width = parsedRaw.ImageWidth || parsedRaw.ExifImageWidth || tiff.ImageWidth || 0;
  const height = parsedRaw.ImageHeight || parsedRaw.ExifImageHeight || tiff.ImageLength || 0;

  let aspectRatio: string | undefined;
  if (width > 0 && height > 0) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const rW = width / divisor;
    const rH = height / divisor;
    if (rW < 50 && rH < 50) {
      aspectRatio = `${rW}:${rH}`;
    } else {
      aspectRatio = `${(width / height).toFixed(2)}:1`;
    }
  }

  const technical: ColorAndTechnicalDetails = {
    colorSpace: icc.ColorSpaceData || (parsedRaw.ColorSpace === 1 ? 'sRGB' : parsedRaw.ColorSpace ? String(parsedRaw.ColorSpace) : 'sRGB'),
    profileDescription: icc.ProfileDescription || 'sRGB Estándar',
    profileCopyright: icc.ProfileCopyright,
    hasIccProfile: Boolean(parsedMulti.icc),
    bitDepth: parsedRaw.BitsPerSample || 8,
    channels: parsedRaw.SamplesPerPixel || 3,
    densityDpi: jfif.XResolution || parsedRaw.XResolution || 72,
    isProgressive: Boolean(parsedRaw.isProgressive),
    format: fileName ? fileName.split('.').pop()?.toUpperCase() : undefined,
    width: width || undefined,
    height: height || undefined,
    aspectRatio,
    fileSizeBytes: effectiveSize,
  };

  const hasRealMetadata = Boolean(
    aiDetection.isAiGenerated ||
    camera ||
    rights ||
    parsedMulti.icc ||
    parsedMulti.xmp ||
    parsedMulti.iptc ||
    parsedMulti.exif ||
    Object.keys(pngChunks).length > 0
  );

  return {
    hasMetadata: hasRealMetadata,
    aiDetection,
    camera,
    rights,
    technical,
    rawTags: parsedRaw,
  };
}
