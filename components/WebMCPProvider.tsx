'use client';

import { useEffect } from 'react';

export const WebMCPProvider: React.FC = () => {
  useEffect(() => {
    try {
      const nav = navigator as any;
      if (typeof nav !== 'undefined' && nav.modelContext?.provideContext) {
        nav.modelContext.provideContext({
          tools: [
            {
              name: 'compress_image',
              description: 'Compress, resize, upscale, or convert an image into WebP, AVIF, JPEG, PNG, TIFF, or GIF formats.',
              inputSchema: {
                type: 'object',
                properties: {
                  format: { 
                    type: 'string', 
                    enum: ['original', 'webp', 'avif', 'jpeg', 'png', 'tiff', 'gif'],
                    default: 'webp'
                  },
                  quality: { type: 'number', default: 85 },
                  upscaleFactor: { type: 'number', enum: [1, 2, 4], default: 1 }
                }
              },
              execute: async (params: any) => {
                return { status: 'ready', endpoint: 'https://web-sling-optimizer.vercel.app/api/compress', params };
              }
            },
            {
              name: 'generate_favicons',
              description: 'Generate multi-resolution favicon.ico, Apple touch icons, PWA icons, OG card and webmanifest.',
              inputSchema: {
                type: 'object',
                properties: {
                  customName: { type: 'string', default: 'Mi Web' }
                }
              },
              execute: async (params: any) => {
                return { status: 'ready', endpoint: 'https://web-sling-optimizer.vercel.app/api/favicon', params };
              }
            }
          ]
        });
      }
    } catch {
      // Ignore if browser does not support WebMCP yet
    }
  }, []);

  return null;
};
