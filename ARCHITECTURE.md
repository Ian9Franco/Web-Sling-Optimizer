# 🏛️ Arquitectura y Árbol de Archivos (File Tree)

Documentación técnica integral de **Web-Sling Optimizer (v2.0 PRO)**: estructura de carpetas, responsabilidades de cada módulo, flujo de datos y documentación por función.

---

## 🌳 Árbol Completo de Archivos (File Tree)

```text
websling/
├── app/                                    # Next.js 14 App Router
│   ├── api/                                # Endpoints de API Serverless (Node.js runtime con Sharp)
│   │   ├── ai/
│   │   │   └── describe/
│   │   │       └── route.ts                # 🤖 Endpoint de Visión Multimodal (Gemini / OpenAI)
│   │   ├── compress/
│   │   │   └── route.ts                    # ⚡ Motor de compresión, Lanczos3, historias con blur y RAW
│   │   └── favicon/
│   │       └── route.ts                    # 🌐 Generador de favicons (.ico, .png, manifest, OG Card)
│   ├── globals.css                         # Tokens de diseño, 3D elevation, glassmorphism y animaciones
│   ├── layout.tsx                          # Layout raíz con WebMCPProvider y metadatos SEO
│   └── page.tsx                            # Orquestador principal SPA y estado global reactivo
├── components/                             # Componentes modulares de interfaz (React / Tailwind / Motion)
│   ├── AIConfigModal.tsx                   # ⚙️ Modal de configuración de API Keys BYOK con garantía de privacidad
│   ├── AIInteractionPreview.tsx            # 🤖 Mini popup interactivo HUD de progreso IA
│   ├── CropModal.tsx                       # 📐 Modal inspector de recorte, aspect ratio e historias 9:16
│   ├── FaviconModal.tsx                    # 📦 Modal y panel de descarga de favicon suite y OG card
│   ├── Footer.tsx                          # 📼 Footer retro '99 con marquee infinito, serverless y enlaces
│   ├── GlobalDropOverlay.tsx               # 📥 Overlay visual de arrastrar y soltar archivos global
│   ├── ImageGrid.tsx                       # 🎴 Vista de cuadrícula / tarjetas de imágenes
│   ├── ImageTable.tsx                      # 📋 Vista de tabla compacta y responsiva (sin scroll horiz.)
│   ├── ImageToolbar.tsx                    # 🛠️ Barra de herramientas de lote (IA, reset, zip, vistas)
│   ├── InfoTooltip.tsx                     # ℹ️ Tooltips informativos con auto-posicionamiento inteligente
│   ├── LiquidGridBackground.tsx            # 🌊 Fondo de tela líquida interactiva con física elástica
│   ├── MetadataModal.tsx                   # 🔍 Modal inspector de metadatos EXIF, GPS y C2PA/IA
│   ├── Navbar.tsx                          # 🧭 Barra de navegación superior con logo animado y métricas
│   ├── PreviewModal.tsx                    # 👁️ Modal comparador visual interactivo
│   ├── SettingsPanel.tsx                   # 🎛️ Panel de control izquierdo (calidad, recorte, presets)
│   ├── SrcsetModal.tsx                     # 💻 Modal generador de snippets HTML5 <picture> / srcset
│   ├── UploadZone.tsx                      # 📂 Zona de carga con drag-and-drop y soporte de ZIPs / RAW
│   ├── VisualizationPanel.tsx              # 🖥️ Panel derecho contenedor de subida y visualización
│   └── WebMCPProvider.tsx                  # 🤖 Registro de herramientas WebMCP en el navegador
├── hooks/                                  # Custom Hooks con lógica desacoplada
│   ├── useAISettings.ts                    # 🧠 Gestión de estado y persistencia de API Keys en localStorage
│   ├── useFaviconGenerator.ts              # 🌐 Gestión del ciclo de generación de favicons
│   ├── useGlobalDrop.ts                    # 📥 Detección de arrastrar y soltar en toda la ventana
│   └── useImageProcessor.ts                # ⚡ Motor orquestador de compresión, lote y estado
├── public/                                 # Assets públicos, discovery y protocolos de agentes
│   ├── .well-known/                        # Protocolos de descubrimiento de IA & Agentes
│   │   ├── agent-skills/
│   │   │   └── index.json                  # 🤖 Índice de Agent Skills (v0.2.0 RFC)
│   │   ├── mcp/
│   │   │   └── server-card.json            # ⚡ Model Context Protocol (SEP-1649 / SEP-2127)
│   │   ├── ai-catalog.json                 # 📑 ARD (Agentic Resource Discovery Manifest)
│   │   ├── api-catalog                     # 🔗 RFC 9727 linkset+json API Catalog
│   │   ├── oauth-authorization-server      # 🔒 Metadatos OAuth Zero-Auth Serverless
│   │   ├── oauth-protected-resource        # 🛡️ RFC 9728 Protected Resource Metadata
│   │   └── openid-configuration            # 🔑 OIDC Configuration
│   ├── auth.md                             # 📜 Especificación de autenticación pública para agentes
│   ├── llms.txt                            # 🤖 Documentación para Modelos de Lenguaje (LLMs)
│   ├── openapi.json                        # 📄 Especificación OpenAPI 3.1.0 completa
│   ├── robots.txt                          # 🤖 Reglas de indexado y crawlers de IA (Content-Signals)
│   ├── sitemap.xml                         # 🗺️ Mapa canónico del sitio
│   ├── favicon.ico                         # Favicon ICO multi-capa
│   └── websling_logo.png                   # 🕷️ Logo oficial de alta resolución
├── scripts/                                # Scripts de automatización y CLI local
│   └── cli/
│       ├── batch.js                        # CLI para optimización por lotes en terminal
│       ├── resize.js                       # CLI interactivo por consola
│       └── README.md
├── tests/                                  # Suite de pruebas automatizadas (Vitest - 27 Tests Pasando)
│   ├── compress.test.ts                    # Tests de compresión, upscaling 2x/4x, historias blur y TIFF/GIF
│   ├── favicon.test.ts                     # Tests de generación de favicons, manifest y OG Cards
│   ├── metadata.test.ts                    # Tests de extracción de metadatos EXIF, GPS y fechas
│   ├── naming.test.ts                      # Tests de patrones de nombre y slugify
│   └── rawParser.test.ts                   # Tests de decodificación y parseo de RAWs de cámara
├── types/                                  # Definiciones de TypeScript
│   ├── ai.ts                               # Tipos de proveedores IA, ajustes y respuestas
│   └── image.ts                            # Tipos de imágenes procesadas, recorte, contain y presets
├── utils/                                  # Utilidades puras reutilizables
│   ├── clientPreCompress.ts                # 🛡️ Pre-compresión Canvas client-side para requests grandes
│   ├── concurrency.ts                      # 🚦 Control de concurrencia en promesas (asyncPool)
│   ├── naming.ts                           # 🏷️ Generador de slugs, textos ALT y patrones
│   ├── rawParser.ts                        # 📷 Extractor de miniaturas embebidas en archivos RAW
│   └── supportedFormats.ts                 # 📋 Mapeo de formatos y validación MIME
├── middleware.ts                           # 📝 Negociación de contenido Markdown (Accept: text/markdown)
├── next.config.js                          # ⚙️ Cabeceras Link RFC 8288, CORS y configuración Serverless
├── package.json                            # Dependencias y scripts de npm
├── tsconfig.json                           # Configuración de compilador TypeScript
└── README.md                               # Documentación principal del repositorio
```

---

## 📐 Descripción Detallada por Módulo y Función

### 1. Endpoints de API (`app/api/`)

#### 📍 `app/api/compress/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Lógica Interna:**
  1. Recibe un `FormData` con el archivo binario y parámetros (`qualityMode`, `quality`, `maxKB`, `format`, `cropFit`, `cropPosition`, `containBackground`, `upscaleFactor`, `clarity`, `stripExif`, `watermarkText`).
  2. Valida formatos y decodifica RAWs si es necesario.
  3. Ejecuta **Super-Resolución Lanczos3** (2x / 4x) y filtro adaptativo de nitidez si `clarity=true`.
  4. Ejecuta modo **Historias 9:16 / Contain Letterbox**:
     - Si `cropFit === 'contain'` y `containBackground === 'blur'`, genera un fondo desenfocado ultra-rápido en ~30ms reduciendo primero a 1/4 antes del gaussian blur y reescalando a las dimensiones del lienzo final.
     - Compone la imagen principal centrada sobre el fondo desenfocado o color sólido.
  5. Aplica algoritmo de compresión:
     - **Modo Manual:** Compresión directa con la calidad solicitada (1-100%).
     - **Modo MaxKB:** Ajuste iterativo descendente hasta no superar el peso objetivo.
     - **Modo Lossless:** Máxima fidelidad estructural sin reducción deliberada de calidad.
  6. Devuelve payload JSON con `base64Data`, dimensiones finales, porcentaje de ahorro y peso resultante.

#### 📍 `app/api/favicon/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Lógica Interna:**
  1. Recibe el logo o imagen base.
  2. Genera `favicon.ico` con capas de 16x16, 32x32 y 48x48.
  3. Genera PNGs para Apple Touch Icon (180x180) y Android Chrome PWA (192x192, 512x512).
  4. Genera `og-card.png` (1200x630) con padding y fondo oscuro para redes sociales.
  5. Retorna `site.webmanifest` y código HTML5 listo para insertar en el `<head>`.

#### 📍 `app/api/ai/describe/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Lógica Interna:**
  1. Conecta con **Google Gemini (1.5 / 2.5 Flash)** o **OpenAI (GPT-4o-mini)**.
  2. Analiza visualmente la escena para devolver un nombre de archivo semántico `kebab-case` y un texto descriptivo ALT accesible.

---

### 2. Custom Hooks (`hooks/`)

- **`useImageProcessor.ts`:** Orquesta el ciclo completo de vida de las imágenes, compresión en lote, análisis con IA, recorte, descargas individuales y exportación en ZIP.
- **`useAISettings.ts`:** Almacena y recupera las API Keys BYOK de Google Gemini y OpenAI en `localStorage` con privacidad total garantizada.
- **`useFaviconGenerator.ts`:** Gestiona el estado de generación y descarga del paquete de favicons.
- **`useGlobalDrop.ts`:** Escucha eventos de arrastrar y soltar globales y pegado desde el portapapeles (`Ctrl + V`).

---

### 3. Middleware & Descubrimiento de Agentes

- **`middleware.ts`:** Intercepta peticiones entrantes:
  - Si el cliente solicita `Accept: text/markdown` o `/index.md`, devuelve una versión en Markdown con metadatos `x-markdown-tokens`.
  - Inyecta cabeceras `Link` (RFC 8288 / RFC 9727) apuntando a los catálogos de API y MCP.
- **`WebMCPProvider.tsx`:** Registra las herramientas de compresión y favicons en `navigator.modelContext` en navegadores compatibles con WebMCP.

---

## 🧪 Suite de Tests Automatizados (`tests/`)

El proyecto cuenta con **27 tests automatizados en Vitest**:
- `tests/compress.test.ts`: Validación de compresión, upscaling Lanczos3 2x, claridad HD, historias 9:16 con blur background y exportación a TIFF/GIF.
- `tests/favicon.test.ts`: Validación de generación del paquete de 7 iconos, OG Card y WebManifest.
- `tests/metadata.test.ts`: Extracción de metadatos EXIF, coordenadas GPS, fechas y dimensiones.
- `tests/rawParser.test.ts`: Decodificación y parsing de archivos RAW de cámara.
- `tests/naming.test.ts`: Sanitización de nombres, slugify y reemplazo de tokens dinámicos.
