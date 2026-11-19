import sharp from 'sharp';
import ImageTracer from 'imagetracerjs';
import type { SvgRenderMode } from '../types/image';

const MAX_TRACE_EDGE = 640;

function colorCountForQuality(quality: number, grayscale: boolean): number {
  if (grayscale) return 2;
  const q = Math.max(1, Math.min(100, quality));
  if (q >= 95) return 24;
  if (q >= 85) return 16;
  if (q >= 70) return 12;
  if (q >= 50) return 8;
  if (q >= 30) return 4;
  return 2;
}

export function isSvgBuffer(buffer: Buffer, name = '', mime = ''): boolean {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.svg') || mime === 'image/svg+xml') return true;
  const head = buffer.subarray(0, Math.min(buffer.length, 400)).toString('utf8').trim().toLowerCase();
  return head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'));
}

/** Quita scripts y handlers antes de devolver un SVG al navegador. */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\sdesc="[^"]*"/gi, '');
}

async function countQuantizedColors(pngBuffer: Buffer): Promise<number> {
  const { data } = await sharp(pngBuffer)
    .resize(48, 48, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const seen = new Set<number>();
  for (let i = 0; i < data.length; i += 3) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    seen.add(key);
    if (seen.size > 36) return seen.size;
  }
  return seen.size;
}

function applyDisplaySize(svg: string, width: number, height: number): string {
  let next = svg;
  if (/\swidth="/.test(next)) {
    next = next.replace(/\swidth="[^"]*"/, ` width="${width}"`);
  } else {
    next = next.replace('<svg', `<svg width="${width}"`);
  }
  if (/\sheight="/.test(next)) {
    next = next.replace(/\sheight="[^"]*"/, ` height="${height}"`);
  } else {
    next = next.replace('<svg', `<svg height="${height}"`);
  }
  return next;
}

export async function embedRasterAsSvg(pngBuffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
  const meta = await sharp(pngBuffer).metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;
  const png = await sharp(pngBuffer).png({
    compressionLevel: 9,
    palette: !meta.hasAlpha,
  }).toBuffer();
  const b64 = png.toString('base64');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image width="${width}" height="${height}" href="data:image/png;base64,${b64}"/>
</svg>
`;
  return { buffer: Buffer.from(svg, 'utf8'), width, height };
}

async function traceToSvg(pngBuffer: Buffer, colors: number): Promise<{ buffer: Buffer; width: number; height: number }> {
  const meta = await sharp(pngBuffer).metadata();
  const srcW = meta.width || 1;
  const srcH = meta.height || 1;
  const scale = Math.min(1, MAX_TRACE_EDGE / Math.max(srcW, srcH));
  const traceW = Math.max(1, Math.round(srcW * scale));
  const traceH = Math.max(1, Math.round(srcH * scale));

  const { data, info } = await sharp(pngBuffer)
    .resize(traceW, traceH, { fit: 'fill', kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const traced = ImageTracer.imagedataToSVG(
    {
      width: info.width,
      height: info.height,
      data: new Uint8ClampedArray(data),
    },
    {
      numberofcolors: Math.max(2, colors),
      scale: 1,
      strokewidth: 0,
      viewbox: true,
      desc: false,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      colorquantcycles: 3,
      linefilter: true,
      rightangleenhance: true,
    }
  );

  if (!traced || !traced.includes('<svg')) {
    throw new Error('No se pudo vectorizar la imagen a SVG.');
  }

  const sized = applyDisplaySize(sanitizeSvg(traced), srcW, srcH);
  return { buffer: Buffer.from(sized, 'utf8'), width: srcW, height: srcH };
}

export async function convertRasterToSvg(
  pngBuffer: Buffer,
  options: {
    mode: SvgRenderMode;
    grayscale: boolean;
    quality: number;
    maxBytes?: number;
  }
): Promise<{ buffer: Buffer; width: number; height: number; modeApplied: 'vector' | 'embed' }> {
  let mode = options.mode;
  if (mode === 'auto') {
    const colors = await countQuantizedColors(pngBuffer);
    mode = colors <= 36 ? 'vector' : 'embed';
  }

  if (mode === 'vector') {
    const start = colorCountForQuality(options.quality, options.grayscale);
    const ladder = [start];
    if (options.maxBytes) {
      for (const colors of [16, 12, 8, 4, 2]) {
        if (colors < ladder[ladder.length - 1]) ladder.push(colors);
      }
    }

    let best: { buffer: Buffer; width: number; height: number } | null = null;
    for (const colors of ladder) {
      try {
        best = await traceToSvg(pngBuffer, colors);
        if (!options.maxBytes || best.buffer.length <= options.maxBytes) break;
      } catch {
        best = null;
      }
    }

    if (best && (options.mode === 'vector' || !options.maxBytes || best.buffer.length <= options.maxBytes)) {
      return { ...best, modeApplied: 'vector' };
    }
  }

  const embedded = await embedRasterAsSvg(pngBuffer);
  return { ...embedded, modeApplied: 'embed' };
}
