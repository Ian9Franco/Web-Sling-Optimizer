import { describe, it, expect } from 'vitest';
import { slugify, generateAltText, resolveFileNamePattern } from '../utils/naming';

describe('Utilidades de Renombrado SEO y Texto ALT', () => {
  it('slugify debe normalizar acentos, espacios y caracteres especiales en kebab-case', () => {
    expect(slugify('Sofá Moderno Café (Edición 2024!)')).toBe('sofa-moderno-cafe-edicion-2024');
    expect(slugify('IMG_2024-09-08_12.30.jpg')).toBe('img-2024-09-08-12-30-jpg');
  });

  it('generateAltText debe generar texto legible y limpio para accesibilidad', () => {
    expect(generateAltText('sofa-moderno-cuero-negro-1000x600.jpg')).toBe('Sofa moderno cuero negro');
    expect(generateAltText('zapatillas_running_nike.webp')).toBe('Zapatillas running nike');
  });

  it('resolveFileNamePattern debe resolver correctamente tokens como original, width, height, slug, index', () => {
    const img = {
      originalName: 'sofa3.jpg',
      outputFileName: 'sofa3.jpg',
      finalWidth: 1000,
      finalHeight: 600,
      formatApplied: 'JPG',
    };

    // Patrón del usuario: {original}-{width}x{height}
    expect(resolveFileNamePattern('{original}-{width}x{height}', img, 0)).toBe('sofa3-1000x600.jpg');

    // Patrón con slug y ceros en el índice
    expect(resolveFileNamePattern('{slug}-{0index}', img, 2)).toBe('sofa3-03.jpg');

    // Patrón con dimensiones
    expect(resolveFileNamePattern('{original}-{width}', img, 0)).toBe('sofa3-1000.jpg');
  });
});
