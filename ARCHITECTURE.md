# 🏛️ Arquitectura y Árbol de Archivos (File Tree)

Documentación técnica integral de **Web-Sling Optimizer**: estructura de carpetas, responsabilidades de cada módulo, flujo de datos y documentación por función.

---

## 🌳 Árbol Completo de Archivos (File Tree)

```text
websling/
├── app/                                    # Next.js 14 App Router
│   ├── api/                                # Endpoints de API Serverless (Node.js runtime)
│   │   ├── ai/
│   │   │   └── describe/
│   │   │       └── route.ts                # 🤖 Endpoint de Visión Multimodal (Gemini / OpenAI)
│   │   ├── compress/
│   │   │   └── route.ts                    # ⚡ Motor de compresión, filtros, recorte y Sharp
│   │   └── favicon/
│   │       └── route.ts                    # 🌐 Generador de favicons (.ico, .png, manifest)
│   ├── globals.css                         # Estilos globales, variables CSS y animaciones
│   ├── layout.tsx                          # Layout principal con metadatos y SEO
│   └── page.tsx                            # Página principal y orquestador de componentes
├── components/                             # Componentes modulares de interfaz (React / Tailwind)
│   ├── AIConfigModal.tsx                   # ⚙️ Modal de configuración de API Keys (Gemini/OpenAI)
│   ├── AIInteractionPreview.tsx            # 🤖 Mini popup interactivo HUD de progreso IA
│   ├── CropModal.tsx                       # 📐 Modal inspector de recorte y aspect ratio (Ads)
│   ├── FaviconModal.tsx                    # 📦 Modal y panel de descarga de favicon suite
│   ├── Footer.tsx                          # 📼 Footer retro '99 con marquee infinito y rainbow bar
│   ├── GlobalDropOverlay.tsx               # 📥 Overlay visual de arrastrar y soltar archivos global
│   ├── ImageGrid.tsx                       # 🎴 Vista de cuadrícula / tarjetas de imágenes
│   ├── ImageTable.tsx                      # 📋 Vista de tabla compacta y responsiva (sin scroll horiz.)
│   ├── ImageToolbar.tsx                    # 🛠️ Barra de herramientas de lote (IA, reset, zip, vistas)
│   ├── LiquidGridBackground.tsx            # 🌊 Fondo de cuadrícula interactiva con física elástica
│   ├── Navbar.tsx                          # 🧭 Barra de navegación superior con logo y métricas
│   ├── PreviewModal.tsx                    # 👁️ Modal comparador visual interactivo
│   ├── SettingsPanel.tsx                   # 🎛️ Panel de control izquierdo (calidad, recorte, presets)
│   ├── SrcsetModal.tsx                     # 💻 Modal generador de snippets HTML5 <picture> / srcset
│   ├── UploadZone.tsx                      # 📂 Zona de carga con drag-and-drop y soporte de ZIPs
│   └── VisualizationPanel.tsx              # 🖥️ Panel derecho contenedor de subida y visualización
├── hooks/                                  # Custom Hooks con lógica desacoplada
│   ├── useAISettings.ts                    # 🧠 Gestión de estado y persistencia de API Keys
│   ├── useFaviconGenerator.ts              # 🌐 Gestión del ciclo de generación de favicons
│   ├── useGlobalDrop.ts                    # 📥 Detección de arrastrar y soltar en toda la ventana
│   └── useImageProcessor.ts                # ⚡ Motor orquestador de compresión, lote y estado
├── public/                                 # Assets públicos e iconos estáticos
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── site.webmanifest
│   └── websling_logo.png                   # 🕷️ Logo oficial de alta resolución
├── scripts/                                # Scripts de automatización y CLI local
│   └── cli/
│       ├── batch.js                        # CLI para optimización por lotes en terminal
│       ├── resize.js                       # CLI interactivo por consola
│       └── README.md
├── tests/                                  # Suite de pruebas automatizadas (Vitest)
│   ├── compress.test.ts                    # Tests de compresión y formatos
│   └── naming.test.ts                      # Tests de patrones de nombre y slugify
├── types/                                  # Definiciones de TypeScript
│   ├── ai.ts                               # Tipos de proveedores IA, ajustes y respuestas
│   └── image.ts                            # Tipos de imágenes procesadas, recorte y presets
├── utils/                                  # Utilidades puras reutilizables
│   ├── clientPreCompress.ts                # 🛡️ Pre-compresión Canvas client-side para requests grandes
│   ├── concurrency.ts                      # 🚦 Control de concurrencia en promesas (asyncPool)
│   └── naming.ts                           # 🏷️ Generador de slugs, textos ALT y patrones
├── ROADMAP_AI_UPSCALING_AND_ENHANCEMENT.md # 🚀 Hoja de ruta para Super-Resolución y remoción de fondo
├── LICENSE                                 # Licencia MIT
├── package.json                            # Dependencias y scripts de npm
├── tsconfig.json                           # Configuración de compilador TypeScript
└── README.md                               # Documentación principal del repositorio
```

---

## 📐 Descripción Detallada por Módulo y Función

### 1. Endpoints de API (`app/api/`)

#### 📍 `app/api/compress/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Descripción:** Recibe un `FormData` con la imagen y parámetros (calidad, dimensiones, rotación, recorte, marca de agua, formato).
- **Lógica Interna:**
  1. Valida el tamaño de la solicitud para mantenerse dentro de los límites del entorno serverless.
  2. Extrae metadatos con `sharp`.
  3. Ejecuta transformaciones iniciales (rotación, escala de grises, recorte con `fit` y posición).
  4. Inyecta marca de agua SVG si fue solicitada.
  5. Ejecuta compresión:
     - **Modo Manual:** Aplica la calidad solicitada (1-100%).
     - **Modo MaxKB:** Reduce la calidad de forma iterativa en pasos hasta cumplir el peso máximo o alcanzar el umbral mínimo configurado.
     - **Modo Sin Pérdida / máxima fidelidad:** Evita una reducción intencional de calidad; algunas transformaciones o conversiones pueden requerir recodificación.
  6. Devuelve payload JSON con `base64Data`, dimensiones finales, porcentaje de ahorro y peso resultante.

> **Nota:** El modo MaxKB actual utiliza una búsqueda lineal descendente de calidad. Una búsqueda binaria real queda como mejora de rendimiento futura.

#### 📍 `app/api/ai/describe/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Descripción:** Analizador de visión artificial para SEO y Accesibilidad.
- **Lógica Interna:**
  1. Recibe la imagen o base64 y credenciales privadas del usuario para completar la solicitud al proveedor seleccionado.
  2. Genera una miniatura ligera de 512px (JPEG 80%) para minimizar el consumo de tokens y acelerar la respuesta.
  3. Conecta con **Google Gemini** (con fallback automático de modelos y versiones `v1beta`/`v1`) o **OpenAI GPT-4o-mini**.
  4. Retorna `fileName` (kebab-case limpio) y `altText` contextual.

#### 📍 `app/api/favicon/route.ts`
- **Función:** `POST(req: NextRequest)`
- **Descripción:** Generador de paquete completo de favicons web en memoria.
- **Lógica Interna:** Genera `favicon.ico` (multi-capa 16x16, 32x32, 48x48), PNGs para Apple/Android y `site.webmanifest`.

---

### 2. Custom Hooks (`hooks/`)

#### 📍 `hooks/useImageProcessor.ts`
- **Funciones Principales:**
  - `handleFiles(files)`: Procesa archivos subidos (incluyendo extracción de `.zip`).
  - `reprocessBatch(overrides)`: Re-ejecuta la compresión sobre la lista activa preservando nombres SEO y textos ALT.
  - `analyzeSingleAI(img, settings)`: Analiza una imagen individual con la IA y actualiza su estado.
  - `analyzeBatchAI(settings)`: Analiza todas las imágenes del lote en paralelo controlado (2 concurrentes).
  - `downloadAllZip()`: Empaqueta todas las imágenes optimizadas en un ZIP junto con `metadata.json`.
  - `applyBatchRename(pattern)`: Aplica un patrón de comodines (`{slug}`, `{width}`, `{index}`, etc.).

#### 📍 `hooks/useAISettings.ts`
- **Función:** Administra las claves de API (Gemini/OpenAI), modelo seleccionado y contexto de marca en `localStorage`.

#### 📍 `hooks/useGlobalDrop.ts`
- **Función:** Escucha eventos de arrastrar y soltar (`dragover`, `drop`) y pegado de imágenes (`paste` / Ctrl+V) en toda la ventana del navegador.

#### 📍 `hooks/useFaviconGenerator.ts`
- **Función:** Maneja el estado y descarga en `.zip` de la suite de favicons generada.

---

### 3. Utilidades (`utils/`)

#### 📍 `utils/clientPreCompress.ts`
- **Función:** `clientPreCompress(file: File | Blob): Promise<File>`
- **Descripción:** Cuando una imagen supera el umbral configurado y requiere transformación, puede precomprimirse en un `<canvas>` antes de enviarse por HTTP para reducir el riesgo de exceder los límites de payload del entorno serverless. Si el usuario seleccionó un flujo que preserve el archivo original, no se modifica de forma preventiva.

#### 📍 `utils/naming.ts`
- **Funciones:**
  - `slugify(text)`: Limpia acentos, caracteres especiales y espacios convirtiéndolos a kebab-case.
  - `generateAltText(fileName)`: Genera un texto alternativo básico a partir del nombre.
  - `resolveFileNamePattern(pattern, img, index)`: Resuelve comodines (`{slug}`, `{original}`, `{width}`, `{height}`, `{quality}`, `{format}`, `{index}`, `{0index}`).

#### 📍 `utils/concurrency.ts`
- **Función:** `asyncPool(poolLimit, array, iteratorFn)`
- **Descripción:** Limita la cantidad de promesas que se ejecutan en simultáneo para evitar saturar el navegador o la conexión de red.

---

### 4. Componentes Visuales Clave (`components/`)

- **`LiquidGridBackground.tsx`:** Canvas con física elástica de resorte (*spring physics*) y cálculo de deformación por gravedad según el cursor.
- **`AIInteractionPreview.tsx`:** Ventana flotante estilo HUD en la esquina inferior derecha que se abre al comenzar el análisis de IA y se cierra al finalizar.
- **`ImageTable.tsx`:** Tabla adaptativa sin scroll horizontal con inputs inline, botón de análisis de IA individual y acciones rápidas.
- **`SettingsPanel.tsx`:** Panel con controles de calidad, presets nativos y personalizados, redimensionamiento, recorte, marca de agua y renombramiento.
- **`Footer.tsx`:** Pie de página con franja rainbow retro '99 y marquesina animada en bucle infinito.
