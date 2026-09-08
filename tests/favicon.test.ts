import { describe, it, expect } from 'vitest';
import { generateWebManifest, generateHeadSnippet, DEFAULT_FAVICON_METADATA } from '../utils/faviconHelper';
import { FaviconMetadata } from '../types/image';

describe('Favicon and SEO Metadata Generator', () => {
  it('generates valid webmanifest with default metadata', () => {
    const manifestStr = generateWebManifest();
    const manifest = JSON.parse(manifestStr);

    expect(manifest.name).toBe('Mi Aplicación Web');
    expect(manifest.short_name).toBe('App');
    expect(manifest.theme_color).toBe('#2563eb');
    expect(manifest.background_color).toBe('#090b10');
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons[0].sizes).toBe('192x192');
    expect(manifest.icons[1].sizes).toBe('512x512');
  });

  it('generates custom webmanifest with custom AI metadata', () => {
    const customMeta: FaviconMetadata = {
      appName: 'WebSling Pro',
      shortName: 'WebSling',
      description: 'El optimizador de imágenes ultrarrápido con IA.',
      themeColor: '#e62429',
      backgroundColor: '#111522',
      keywords: 'optimizador, webp, compresión',
    };

    const manifestStr = generateWebManifest(customMeta);
    const manifest = JSON.parse(manifestStr);

    expect(manifest.name).toBe('WebSling Pro');
    expect(manifest.short_name).toBe('WebSling');
    expect(manifest.description).toBe('El optimizador de imágenes ultrarrápido con IA.');
    expect(manifest.theme_color).toBe('#e62429');
    expect(manifest.background_color).toBe('#111522');
  });

  it('generates <head> HTML snippet with SEO, OpenGraph and Twitter tags', () => {
    const customMeta: FaviconMetadata = {
      appName: 'CyberStore',
      shortName: 'Cyber',
      description: 'Tienda de tecnología futurista.',
      themeColor: '#10b981',
      backgroundColor: '#05070a',
      keywords: 'cyberpunk, hardware, tech',
    };

    const snippet = generateHeadSnippet(customMeta, 'cyber-icon');

    expect(snippet).toContain('<link rel="icon" type="image/x-icon" href="/favicon.ico">');
    expect(snippet).toContain('<link rel="icon" type="image/png" sizes="16x16" href="/cyber-icon-16x16.png">');
    expect(snippet).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/cyber-icon-32x32.png">');
    expect(snippet).toContain('<meta name="theme-color" content="#10b981">');
    expect(snippet).toContain('<title>CyberStore</title>');
    expect(snippet).toContain('<meta name="description" content="Tienda de tecnología futurista.">');
    expect(snippet).toContain('<meta name="keywords" content="cyberpunk, hardware, tech">');
    expect(snippet).toContain('<meta property="og:title" content="CyberStore">');
    expect(snippet).toContain('<meta name="twitter:title" content="CyberStore">');
  });
});
