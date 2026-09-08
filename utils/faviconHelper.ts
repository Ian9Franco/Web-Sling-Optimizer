import { FaviconIconItem, FaviconMetadata } from '../types/image';

export const DEFAULT_FAVICON_METADATA: FaviconMetadata = {
  appName: 'Mi Aplicación Web',
  shortName: 'App',
  description: 'Sitio web y aplicación optimizada para alto rendimiento.',
  themeColor: '#2563eb',
  backgroundColor: '#090b10',
  keywords: 'web, app, pwa, fast',
};

/**
 * Genera el contenido de site.webmanifest con los metadatos y tamaños de iconos correspondientes
 */
export function generateWebManifest(
  metadata: FaviconMetadata = DEFAULT_FAVICON_METADATA,
  _icons?: FaviconIconItem[]
): string {
  const manifestObj = {
    name: metadata.appName || DEFAULT_FAVICON_METADATA.appName,
    short_name: metadata.shortName || DEFAULT_FAVICON_METADATA.shortName,
    description: metadata.description || DEFAULT_FAVICON_METADATA.description,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: metadata.themeColor || DEFAULT_FAVICON_METADATA.themeColor,
    background_color: metadata.backgroundColor || DEFAULT_FAVICON_METADATA.backgroundColor,
    display: 'standalone',
    start_url: '/',
  };

  return JSON.stringify(manifestObj, null, 2);
}

/**
 * Genera el snippet HTML para el <head> con favicons, manifest, theme-color y Open Graph / Twitter Cards
 */
export function generateHeadSnippet(
  metadata: FaviconMetadata = DEFAULT_FAVICON_METADATA,
  customName: string = 'favicon'
): string {
  const safeName = customName.trim().toLowerCase().replace(/\.[^/.]+$/, '') || 'favicon';
  const appName = metadata.appName || DEFAULT_FAVICON_METADATA.appName;
  const description = metadata.description || DEFAULT_FAVICON_METADATA.description;
  const themeColor = metadata.themeColor || DEFAULT_FAVICON_METADATA.themeColor;
  const keywords = metadata.keywords || DEFAULT_FAVICON_METADATA.keywords;

  return `<!-- Favicons & Web App Icons -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/${safeName}-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/${safeName}-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="${themeColor}">
<meta name="msapplication-TileColor" content="${themeColor}">

<!-- SEO & Social Meta Tags -->
<title>${appName}</title>
<meta name="description" content="${description}">
${keywords ? `<meta name="keywords" content="${keywords}">\n` : ''}<!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
<meta property="og:type" content="website">
<meta property="og:title" content="${appName}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${appName}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="/og-image.png">`;
}
