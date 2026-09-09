# 🕸️ Web-Sling Optimizer PRO (v2.0)

<p align="center">
  <img src="https://raw.githubusercontent.com/Ian9Franco/Web-Sling-Optimizer/main/public/websling_logo.png" alt="Web-Sling Optimizer Logo" width="220" />
</p>

<p align="center">
  <strong>Optimizador y procesador de imágenes web de alto rendimiento &bull; 100% Serverless &bull; Privacidad Total.</strong><br>
  Compresión inteligente sin pérdida, super-resolución Lanczos3 con Claridad HD, formato Historias 9:16 con blur, soporte RAW universal, suite de favicons, IA Vision SEO y compatibilidad nativa con Agentes Autónomos (MCP, ARD, OpenAPI).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14_(App_Router)-black?style=flat-square&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/Sharp-Libvips_C++-0078D7?style=flat-square" alt="Sharp">
  <img src="https://img.shields.io/badge/Framer_Motion-12-ff0055?style=flat-square&logo=framer" alt="Framer Motion">
  <img src="https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vitest-27_Tests_Passed-6E9F18?style=flat-square&logo=vitest" alt="Vitest Tests">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License MIT">
</p>

---

## ⚡ Novedades y Características Principales (v2.0)

### 🖼️ 1. Compresión y Motor de Imagen Ultra Rápido
- **🎯 Compresión por Peso Objetivo (Target KB):** Algoritmo iterativo inteligente que ajusta la calidad de forma progresiva hasta lograr el peso máximo deseado sin degradar la imagen innecesariamente.
- **✨ Modo Sin Pérdida (Lossless):** Preserva el 100% de la fidelidad cromática y detalle original con máxima compresión estructural.
- **🔄 Soporte Multi-Formato Universal:** Exportación y conversión entre **WebP, AVIF, JPEG, PNG, TIFF y GIF** (estático y animado).
- **📷 Soporte de Formatos RAW & HEIC:** Decodificación directa de archivos de cámara profesional (**DNG, CR2, NEF, ARW, HEIC**).
- **🔍 Super-Resolución Lanczos3 (2x / 4x) & Claridad HD:** Reescalado de alta fidelidad con algoritmo Lanczos3 y filtro adaptativo de nitidez HD.

### 📱 2. Modo Historias 9:16 y Aspect Ratio Contain (Sin Recortes)
- **📐 Relleno Inteligente con Fondo Desenforcado (`Blur Background`):** Convierte imágenes horizontales (16:9, 4:3) a formato vertical Historia/Reels (9:16 / 1080x1920) sin perder bordes ni recortar a personas o productos.
- **⚡ Algoritmo Ultra-Rápido:** Desenfoque cinemático generado en ~30ms mediante downscaling + gaussian blur acelerado en `sharp`.
- **🎨 Fondos Alternativos:** Soporte para relleno con fondo negro, blanco o transparente.

### 🤖 3. Inteligencia Artificial Vision Multimodal (SEO & Accesibilidad)
- **🧠 Modelos Integrados:** Compatible con **Google Gemini (1.5 Flash, 2.5 Flash, 1.5 Pro)** y **OpenAI (GPT-4o, GPT-4o-mini)**.
- **🏷️ Generación de Nombres SEO:** Analiza visualmente la escena para crear nombres de archivo semánticos en formato `kebab-case`.
- **👁️ Textos ALT Accesibles:** Redacción descriptiva en español o inglés orientada a accesibilidad web (WCAG) y posicionamiento en Google Imágenes.
- **⚡ Análisis Individual o en Lote:** Procesa una imagen o analiza toda la cola en paralelo con barra de progreso interactiva.

### 📦 4. Suite Completa de Favicons & Web App Manifest
- **🎯 Paquete 7-en-1 en 1 Clic:**
  - `favicon.ico` multi-resolución embebido (16x16, 32x32, 48x48).
  - `favicon-16x16.png` y `favicon-32x32.png`.
  - `apple-touch-icon.png` (180x180) para iOS Safari.
  - `android-chrome-192x192.png` y `android-chrome-512x512.png` para PWAs.
  - `og-card.png` (1200x630) optimizada para previsualizaciones en redes sociales.
  - `site.webmanifest` listo para producción.
- **💻 Snippet HTML5:** Código `<head>` generado automáticamente con botón de copiado directo.

### 🛡️ 5. Arquitectura Serverless & Privacidad Total (Zero-Server Storage)
- **🔒 Sin Almacenamiento en Servidor:** Las imágenes se procesan en memoria en entornos serverless efímeros y **NUNCA** se persisten en disco ni bases de datos.
- **🔑 BYOK 100% Local:** Tus API Keys de Gemini/OpenAI se almacenan exclusivamente en el `localStorage` de tu navegador y viajan directamente al proveedor oficial sin intermediarios.
- **🧹 Limpieza EXIF & GPS:** Eliminación opcional de metadatos de geolocalización y cámaras para máxima privacidad.

### 🎨 6. Diseño Visual 3D & Micro-Interacciones
- **🌊 Fondo Líquido Spider-Silk Cyber Fluid:** Malla reactiva sobre canvas HTML5 con oleaje armónico continuo, ondas de choque elásticas al hacer clic y polvo de estrellas luminiscente.
- **🪟 Vidrio Esmerilado 3D (Frosted Glassmorphism):** Paneles translúcidos con `backdrop-filter: blur(24px)`, biseles especulares y sombras de oclusión ambiental multi-nivel.
- **✨ Animaciones con Framer Motion:** Micro-interacciones fluidas en logotipo, botones del header y modales.
- **ℹ️ Tooltips Informativos Inteligentes `(i)`:** Explicaciones contextuales en cada control con auto-posicionamiento inteligente para evitar recortes en pantalla.

### 🤖 7. Ecosistema de Agentes Autónomos (Agent Ready)
Web-Sling cuenta con compatibilidad de nivel de producción para agentes de IA:
- **`robots.txt`:** Reglas optimizadas para `GPTBot`, `Claude-Web`, `Google-Extended` y directivas `Content-Signal`.
- **`sitemap.xml`:** Estándar sitemaps.org con indexado canónico.
- **OpenAPI 3.1.0:** Especificación completa en [`/openapi.json`](https://web-sling-optimizer.vercel.app/openapi.json).
- **API Catalog (RFC 9727):** Descubrimiento automatizado en `/.well-known/api-catalog` (`application/linkset+json`).
- **ARD (Agentic Resource Discovery):** Manifiesto en `/.well-known/ai-catalog.json`.
- **MCP Server Cards (SEP-1649 / SEP-2127):** Descubrimiento Model Context Protocol en `/.well-known/mcp/server-card.json` y `/.well-known/mcp.json`.
- **Agent Skills Discovery:** Índice en `/.well-known/agent-skills/index.json`.
- **Markdown Content Negotiation:** Respuesta automática en Markdown para agentes con cabecera `Accept: text/markdown` o `/index.md`.
- **WebMCP:** Registro de herramientas en el cliente mediante `navigator.modelContext`.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Web** | [Next.js 14](https://nextjs.org/) (App Router & Middleware) |
| **Motor de Imagen** | [Sharp](https://sharp.pixelplumbing.com/) (Libvips de alta velocidad en C++) |
| **Animaciones UI** | [Framer Motion 12](https://www.framer.com/motion/) |
| **Estilos & Glassmorphism** | [Tailwind CSS v3](https://tailwindcss.com/) + CSS Tokens |
| **Testing & CI** | [Vitest](https://vitest.dev/) (27 pruebas unitarias y de integración) |
| **Empaquetado ZIP** | [JSZip](https://stuk.github.io/jszip/) |
| **Iconografía** | [Lucide React](https://lucide.dev/) |
| **Lenguaje** | [TypeScript 5.6](https://www.typescriptlang.org/) |

---

## 🚀 Instalación y Uso Local

### Requisitos Previos
- **Node.js 18.17** o superior
- **npm**, **pnpm** o **yarn**

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Ian9Franco/Web-Sling-Optimizer.git
   cd Web-Sling-Optimizer
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

4. **Ejecutar Suite de Tests:**
   ```bash
   npm test
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 💻 Herramientas CLI por Consola

Para optimizar carpetas locales de imágenes por lotes sin abrir el navegador:

```bash
# Redimensionador interactivo por consola
npm run cli

# Compresión masiva de la carpeta ./imgs hacia ./imgs_resized
npm run cli:batch
```
*Más detalles en [`scripts/cli/README.md`](scripts/cli/README.md).*

---

## 🏛️ Estructura del Proyecto

```
web-sling-optimizer/
├── app/
│   ├── api/
│   │   ├── compress/        # API Serverless de compresión, Lanczos3 y formatos
│   │   └── favicon/         # API Serverless de generación de favicons y manifiestos
│   ├── globals.css          # Tokens de diseño, 3D elevation y glassmorphism
│   ├── layout.tsx           # RootLayout con WebMCPProvider
│   └── page.tsx             # Panel principal SPA
├── components/
│   ├── AIConfigModal.tsx    # Modal de configuración BYOK (Gemini / OpenAI)
│   ├── CropModal.tsx        # Modal de recorte y presets de anuncios / historias
│   ├── FaviconModal.tsx     # Generador visual de favicons y OG cards
│   ├── Footer.tsx           # Footer con marquesina y enlaces
│   ├── InfoTooltip.tsx      # Tooltips (i) con auto-posicionamiento inteligente
│   ├── LiquidGridBackground.tsx # Canvas 60fps con física elástica
│   ├── Navbar.tsx           # Header estilizado con animaciones Framer Motion
│   ├── SettingsPanel.tsx    # Controles de compresión, calidad y presets
│   ├── UploadZone.tsx       # Dropzone con soporte ZIP y RAW
│   └── VisualizationPanel.tsx # Cola de imágenes con vistas Tabla y Grid
├── hooks/
│   ├── useAISettings.ts     # Gestión de claves BYOK en localStorage
│   ├── useImageProcessor.ts # Pipeline reactivo de procesamiento
│   └── useFaviconGenerator.ts # Hook de generación de favicons
├── public/                  # Robots.txt, Sitemap, OpenAPI, MCP y Assets
├── tests/                   # 27 tests unitarios en Vitest
├── middleware.ts            # Negociación de contenido Markdown para agentes
└── next.config.js           # Cabeceras RFC 8288 y configuración Serverless
```

---

## 👤 Autor

Desarrollado por **Ian Pontorno**:
- 🌐 **Portafolio:** [https://ian-pontorno-portfolio.vercel.app/](https://ian-pontorno-portfolio.vercel.app/)
- 🐙 **GitHub:** [@Ian9Franco](https://github.com/Ian9Franco)
- 💻 **Repositorio:** [Web-Sling-Optimizer](https://github.com/Ian9Franco/Web-Sling-Optimizer)

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
