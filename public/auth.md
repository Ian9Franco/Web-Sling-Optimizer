# Web-Sling Optimizer Agent Authentication Specification (Auth.md)

## Overview
Web-Sling Optimizer is an open, serverless, zero-auth developer utility and image processing suite.

## Authentication Model
- **Public Endpoints**: All core image optimization (`/api/compress`) and favicon generation (`/api/favicon`) endpoints are public and require **NO** API key, OAuth credentials, or account registration.
- **Client-Side Privacy**: Web-Sling operates on a Zero-Server-Storage policy. Images and API keys for AI Vision (Google Gemini / OpenAI) are processed in-memory or kept in client-side `localStorage`. No user data or credentials are persisted on servers.

## API Endpoints
- `POST https://web-sling-optimizer.vercel.app/api/compress` - Multi-format image compression, Lanczos3 super-resolution, aspect ratio contain padding, and EXIF strip.
- `POST https://web-sling-optimizer.vercel.app/api/favicon` - Multi-platform favicon generator (ICO, PNG, WebManifest, OG Card).

## Registration
No agent registration required. Agents can immediately consume the OpenAPI specification at `/openapi.json` and the API Catalog at `/.well-known/api-catalog`.
