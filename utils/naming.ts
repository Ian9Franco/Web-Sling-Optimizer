/**
 * Utilidades para formateo SEO de nombres de archivo y generación de texto ALT
 */

/**
 * Convierte un texto a formato slug URL-friendly (kebab-case sin tildes ni caracteres especiales)
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos/diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza caracteres no alfanuméricos por guiones
    .replace(/-+/g, '-')             // Reemplaza múltiples guiones seguidos por uno solo
    .replace(/^-+|-+$/g, '');        // Recorta guiones al inicio o final
}

/**
 * Genera un texto alternativo (ALT) descriptivo y legible a partir de un nombre de archivo
 */
export function generateAltText(fileName: string): string {
  if (!fileName) return '';
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;

  const cleaned = base
    .replace(/\b\d+x\d+\b/gi, '')         // Elimina resoluciones tipo 1000x600
    .replace(/[-_]+/g, ' ')               // Convierte guiones y guiones bajos a espacios
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  // Capitalizar la primera letra
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface PatternImageContext {
  originalName: string;
  outputFileName?: string;
  finalWidth?: number;
  originalWidth?: number;
  finalHeight?: number;
  originalHeight?: number;
  formatApplied?: string;
  qualityApplied?: number;
}

/**
 * Resuelve comodines de renombrado en lote para una imagen
 */
export function resolveFileNamePattern(
  pattern: string,
  img: PatternImageContext,
  index: number
): string {
  if (!pattern || !pattern.trim()) {
    return img.outputFileName || img.originalName;
  }

  const dotIdx = img.originalName.lastIndexOf('.');
  const defaultBaseName = dotIdx !== -1 ? img.originalName.substring(0, dotIdx) : img.originalName;
  const originalExt = dotIdx !== -1 ? img.originalName.substring(dotIdx).toLowerCase() : '.jpg';

  // Obtener extensión del outputFileName actual si existe, o usar formatApplied
  let outExt = originalExt;
  if (img.outputFileName && img.outputFileName.lastIndexOf('.') !== -1) {
    outExt = img.outputFileName.substring(img.outputFileName.lastIndexOf('.')).toLowerCase();
  } else if (img.formatApplied) {
    outExt = `.${img.formatApplied.toLowerCase().replace('jpeg', 'jpg')}`;
  }

  const width = (img.finalWidth || img.originalWidth || 0).toString();
  const height = (img.finalHeight || img.originalHeight || 0).toString();
  const format = outExt.replace('.', '');
  const quality = (img.qualityApplied || 90).toString();
  const idx = (index + 1).toString();
  const padIdx = (index + 1).toString().padStart(2, '0');
  const slug = slugify(defaultBaseName) || defaultBaseName;

  let result = pattern
    .replace(/\{original\}|\{name\}/gi, defaultBaseName)
    .replace(/\{slug\}/gi, slug)
    .replace(/\{width\}/gi, width)
    .replace(/\{height\}/gi, height)
    .replace(/\{format\}/gi, format)
    .replace(/\{quality\}/gi, quality)
    .replace(/\{0index\}|\{index:02d\}/gi, padIdx)
    .replace(/\{index\}|\{idx\}/gi, idx);

  // Si el usuario incluyó accidentalmente la extensión en el patrón, removerla
  result = result.replace(/\.[^/.]+$/, '');

  return `${result}${outExt}`;
}
