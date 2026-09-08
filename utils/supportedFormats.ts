/**
 * Lista exhaustiva de extensiones y formatos de imagen soportados por Web-Sling Optimizer:
 * - Estándares Web: JPG, PNG, WEBP, AVIF, GIF, SVG, BMP, ICO, TIFF
 * - RAW de Cámaras (Réflex / Mirrorless / Smartphones ProRAW):
 *   DNG, RAW, CR2, CR3, CRW (Canon), NEF, NRW (Nikon), ARW, SRF, SR2 (Sony),
 *   ORF (Olympus), RW2 (Panasonic Lumix), PEF, PTX (Pentax), RAF (Fujifilm),
 *   DCR, KDC, K25 (Kodak), ERF (Epson), MEF (Mamiya), MOS (Leaf), MRW (Minolta),
 *   RWL (Leica), 3FR, FFF (Hasselblad), SRW (Samsung), X3F (Sigma)
 * - Formatos Modernos y Especializados:
 *   HEIC, HEIF, HIF (Apple / Modern Mobile), TGA, TARGA, JP2, J2K, JPF, JPX,
 *   HDR, EXR, PSD, EPS, DDS
 */

export const SUPPORTED_EXTENSIONS_LIST = [
  // Web & Estándar
  'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'webp', 'avif', 'gif', 'svg', 'bmp', 'dib', 'ico', 'cur', 'tiff', 'tif',
  // RAW Cámaras
  'dng', 'raw', 'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'orf', 'rw2', 'pef', 'ptx', 'raf',
  'dcr', 'kdc', 'k25', 'erf', 'mef', 'mos', 'mrw', 'rwl', '3fr', 'fff', 'srw', 'x3f',
  // Modernos & Especiales
  'heic', 'heif', 'hif', 'tga', 'targa', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm', 'mj2', 'hdr', 'exr', 'psd', 'eps', 'dds'
] as const;

export const SUPPORTED_EXTENSIONS_REGEX = new RegExp(
  `\\.(${SUPPORTED_EXTENSIONS_LIST.join('|')})$`,
  'i'
);

export const RAW_CAMERA_REGEX = /\.(dng|raw|cr2|cr3|crw|nef|nrw|arw|srf|sr2|orf|rw2|pef|ptx|raf|dcr|kdc|k25|erf|mef|mos|mrw|rwl|3fr|fff|srw|x3f|heic|heif|hif|tga|targa|jp2|j2k|jpf|jpx|hdr|exr|psd|eps|dds)$/i;

export const ACCEPT_FILE_INPUT_STRING = [
  'image/*',
  ...SUPPORTED_EXTENSIONS_LIST.map(ext => `.${ext}`)
].join(',');

/**
 * Valida si un archivo es una imagen soportada por extensión o por tipo MIME.
 * Esencial en Windows / navegadores donde archivos como .DNG o .CR2 tienen mimeType vacío ("").
 */
export function isSupportedImageFile(file: { name: string; type?: string }): boolean {
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  return SUPPORTED_EXTENSIONS_REGEX.test(file.name);
}

/**
 * Extrae la secuencia JPEG de mayor resolución embebida en contenedores RAW / DNG / TIFF.
 * La inmensa mayoría de cámaras (Canon, Nikon, Sony, Apple ProRAW, etc.) incrustan
 * una vista previa JPEG de alta fidelidad con marcadores 0xFF 0xD8 0xFF (SOI) y 0xFF 0xD9 (EOI).
 */
export function extractEmbeddedJpegFromRaw(buffer: ArrayBuffer): Blob | null {
  const bytes = new Uint8Array(buffer);
  let largestJpegStart = -1;
  let largestJpegEnd = -1;
  let maxLen = 0;

  let i = 0;
  while (i < bytes.length - 4) {
    if (bytes[i] === 0xFF && bytes[i + 1] === 0xD8 && bytes[i + 2] === 0xFF) {
      const start = i;
      let j = start + 3;
      let end = -1;
      while (j < bytes.length - 1) {
        if (bytes[j] === 0xFF && bytes[j + 1] === 0xD9) {
          end = j + 2;
          break;
        }
        j++;
      }

      if (end !== -1) {
        const len = end - start;
        // Evitar iconos miniatura de 16x16 (< 5 KB) si existe una vista previa real
        if (len > maxLen && len > 5000) {
          maxLen = len;
          largestJpegStart = start;
          largestJpegEnd = end;
        }
        i = end;
        continue;
      }
    }
    i++;
  }

  if (largestJpegStart !== -1 && largestJpegEnd !== -1) {
    const jpegSlice = bytes.subarray(largestJpegStart, largestJpegEnd);
    return new Blob([jpegSlice], { type: 'image/jpeg' });
  }

  return null;
}
