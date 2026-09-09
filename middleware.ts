import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MARKDOWN_CONTENT = `# Web-Sling Optimizer PRO

> Serverless, ultra-fast image optimization suite, Lanczos3 super-resolution, RAW parsing, metadata inspection, and multi-platform favicon generator.

## Live Application
URL: https://web-sling-optimizer.vercel.app

## Features & Capabilities
1. **Multi-Format Processing**: WebP, AVIF, JPEG, PNG, TIFF, GIF, HEIC, and Camera RAW (DNG, CR2, NEF, ARW).
2. **Quality Modes**:
   - Lossless (100% original fidelity)
   - Quality Slider (1% - 100%)
   - Target File Size (Max KB iterative reduction)
3. **Aspect Ratio Contain & Stories**:
   - Converts horizontal pictures into vertical 9:16 story formats with ultra-fast downscaled blur background padding without losing or cropping content.
4. **Super-Resolution**:
   - Lanczos3 2x and 4x upscaling with optional adaptive clarity sharpening.
5. **Favicon Suite**:
   - Generates multi-size ICO (16x16, 32x32, 48x48), Apple Touch Icon, Android Chrome PWA (192x192, 512x512), OG Card, and webmanifest.
6. **AI Multimodal SEO**:
   - Vision-based semantic slug generation and ALT text extraction via Gemini 1.5 & OpenAI GPT-4o.
7. **Privacy & Security**:
   - 100% Serverless execution, Zero-Server storage policy. No images or API keys are stored or persisted on servers.

## API Endpoints
- **POST /api/compress**: Multipart form-data image compression, resize, upscale, and EXIF strip.
- **POST /api/favicon**: Multipart form-data multi-platform favicon and webmanifest bundle generator.

## Agent Discovery & Catalogs
- OpenAPI Specification: https://web-sling-optimizer.vercel.app/openapi.json
- API Catalog: https://web-sling-optimizer.vercel.app/.well-known/api-catalog
- AI Catalog (ARD): https://web-sling-optimizer.vercel.app/.well-known/ai-catalog.json
- MCP Server Card: https://web-sling-optimizer.vercel.app/.well-known/mcp/server-card.json
- Agent Skills Index: https://web-sling-optimizer.vercel.app/.well-known/agent-skills/index.json
- Auth Specification: https://web-sling-optimizer.vercel.app/auth.md
`;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const acceptHeader = request.headers.get('accept') || '';

  // Content Negotiation: If requested as Markdown or explicitly requesting /index.md
  if (
    (pathname === '/' || pathname === '/index.md') &&
    (acceptHeader.includes('text/markdown') || pathname === '/index.md')
  ) {
    const approximateTokens = Math.ceil(MARKDOWN_CONTENT.length / 4);

    return new NextResponse(MARKDOWN_CONTENT, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'x-markdown-tokens': approximateTokens.toString(),
        'Access-Control-Allow-Origin': '*',
        'Link': '</.well-known/api-catalog>; rel="api-catalog", </.well-known/ai-catalog.json>; rel="service-desc", </.well-known/mcp/server-card.json>; rel="mcp-server", </openapi.json>; rel="service-desc", </llms.txt>; rel="service-doc"'
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/index.md'],
};
