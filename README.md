# 🕸️ Web Sling Optimizer

<p align="center">
  <img src="public/websling_logo.png" alt="Web Sling Optimizer Logo" width="220" />
</p>

<p align="center">
  <strong>Optimizador y procesador de imágenes web de alto rendimiento.</strong><br>
  Compresión iterativa inteligente, redimensionamiento avanzado, recorte con aspect ratio, marcas de agua, generador de favicons y exportación ZIP.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14_(App_Router)-black?style=flat-square&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/Sharp-High_Performance-0078D7?style=flat-square" alt="Sharp">
  <img src="https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License MIT">
</p>

---

## ⚡ Características Principales

- **🎯 Compresión por Peso Objetivo (Target KB):**
  Algoritmo iterativo inteligente que ajusta la calidad de forma progresiva hasta alcanzar exactamente el peso deseado (ej. < 200 KB) sin sacrificar fidelidad visual innecesariamente.
- **🤖 Visión Artificial Multimodal para SEO & Accesibilidad:**
  Integración con **Google Gemini (1.5 Flash / 2.5 Flash)** y **OpenAI (GPT-4o-mini)** para generar nombres descriptivos kebab-case y textos ALT en español e inglés analizando la imagen.
- **🌊 Fondo Líquido Interactivo (Canvas Spring Physics):**
  Cuadrícula técnica interactiva que reacciona con física de resorte y gravedad al peso del cursor en tiempo real (60-120 FPS).
- **📼 Footer Retro '99 con Marquee Infinito:**
  Cinta cromática de espectro rainbow y marquesina continua inspirada en la era dorada de 1999.
- **🔄 Conversión Multi-formato de Vanguardia:**
  Soporte para **WebP**, **AVIF**, **JPEG** y **PNG** con fallback inteligente (si un PNG supera el tamaño objetivo, conmuta a JPG automáticamente).
- **📐 Recorte y Aspect Ratio:**
  Ajustes con `fit` (`cover`, `contain`, `inside`) y posicionamiento inteligente (`center`, `top`, `bottom`, `entropy`, `attention`).
- **🎨 Transformaciones Avanzadas:**
  - Rotación en ángulos de 90° y volteo horizontal (mirror).
  - Conversión a escala de grises.
  - Limpieza opcional de metadatos EXIF (para privacidad y ahorro de bytes).
  - Superposición de marca de agua (watermark) basada en SVG con escape seguro de caracteres.
- **🌐 Generador Completo de Favicons & Manifest:**
  Genera en un solo clic todo el paquete de favicons modernos (`favicon.ico`, `16x16`, `32x32`, `apple-touch-icon`, `site.webmanifest`).
- **📦 Drag & Drop Inteligente:**
  Soporta arrastrar imágenes individuales, carpetas completas y archivos **.ZIP** (extrayéndolos en el cliente con JSZip).
- **💾 Descargas Flexibles:**
  Descarga individual con previsualización o exportación masiva empaquetada en `.zip` con `metadata.json` para CMS y catálogos.
- **💻 Herramientas CLI Standalone:**
  Scripts de consola para procesar colecciones locales de imágenes sin abrir el navegador.

---

## 🏛️ Arquitectura del Proyecto

Para consultar el **árbol completo de archivos (File Tree)** y la documentación detallada por módulo y función, consulta:
👉 **[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Web** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Motor de Imagen** | [Sharp](https://sharp.pixelplumbing.com/) (Libvips de alta velocidad en C++) |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) |
| **Empaquetado ZIP**| [JSZip](https://stuk.github.io/jszip/) |
| **Iconos** | [Lucide React](https://lucide.dev/) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) |

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18.17 o superior
- npm, pnpm o yarn

### Instalación

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

4. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 💻 Herramientas de Terminal (CLI)

Para optimizar imágenes directamente en tu máquina:

```bash
# Redimensionador interactivo por consola
npm run cli

# Compresión masiva de la carpeta ./imgs hacia ./imgs_resized
npm run cli:batch
```
*Más detalles en [`scripts/cli/README.md`](scripts/cli/README.md).*

---

## ⚙️ Arquitectura y Límites Técnicos

- **Procesamiento Server-Side:** Las transformaciones pesadas se ejecutan del lado del servidor mediante rutas de API (`/api/compress` y `/api/favicon`), delegando el cálculo al motor de bajo nivel `sharp`.
- **Límite de Vercel Serverless (4.5 MB):** En despliegues Serverless (como Vercel), las funciones tienen un límite estricto de carga útil en el cuerpo de la petición de **4.5 MB**. La aplicación valida tanto en cliente como en servidor este umbral para evitar fallos inesperados de infraestructura.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
