import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Web-Sling Optimizer - Compresión e Inspección de Imágenes',
  description: 'Comprime tus imágenes con el poder de Web-Sling. Optimización inteligente en lote, edición rápida, marcas de agua y paquetes de favicons.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-mesh text-slate-100 antialiased selection:bg-[#e62429] selection:text-white">
        {children}
      </body>
    </html>
  );
}
