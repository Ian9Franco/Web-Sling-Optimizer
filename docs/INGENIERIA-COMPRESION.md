# Ingeniería de Compresión — Web-Sling Optimizer

Documento técnico que describe **qué motor usamos**, **qué algoritmos aplicamos**, **en qué orden**, y **por qué una imagen puede pasar de 2.5 MB a ~400 KB** aunque visualmente parezca “igual”.

---

## 1. Stack de ingeniería

| Capa | Tecnología | Rol |
|------|-----------|-----|
| **Runtime servidor** | Node.js (Vercel Serverless Functions) | Ejecuta el pipeline de compresión |
| **Motor de imagen** | [Sharp](https://sharp.pixelplumbing.com/) v0.33 | Wrapper de alto nivel sobre **libvips** |
| **Backend nativo** | libvips + libjpeg-turbo / mozjpeg, libwebp, libheif, libpng | Decodificación, transformación y codificación |
| **Pre-procesado cliente** | Canvas API (`HTMLCanvasElement`) | Reduce archivos >4.1 MB antes del upload |
| **Metadatos** | exifr (lectura), Sharp (escritura/eliminación) | EXIF, IPTC, XMP, chunks PNG de texto |
| **Orquestación** | `useImageProcessor.ts` → `POST /api/compress` | Cola concurrente, FormData, estado UI |

**Sharp/libvips** no es un “compresor de metadatos”: decodifica la imagen a **buffer de píxeles** en memoria, aplica transformaciones, y **vuelve a codificar** con el códec y parámetros elegidos. Eso es clave para entender las reducciones de peso.

---

## 2. Pipeline completo (3 fases)

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 0 — Cliente (navegador)                                   │
│  clientPreCompress.ts                                           │
│  Si archivo > 4.1 MB → Canvas resize (máx 4096px) + re-encode  │
└────────────────────────────┬────────────────────────────────────┘
                             │ FormData POST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — Transformaciones (servidor, 1 sola pasada)            │
│  Sharp pipeline: rotate, flip, grayscale, resize, upscale,      │
│  contain/blur, sharpen, median, watermark, composite           │
│  → Buffer intermedio PNG sin compresión (compressionLevel: 0)   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FASE 2 — Codificación final                                    │
│  Modo elegido: Sin Pérdida | Calidad % | Límite KB              │
│  → JPEG / WebP / AVIF / PNG / TIFF / GIF / HEIC                  │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FASE 3 — Salvaguardas                                          │
│  Si resultado ≥ original sin transformaciones → devolver original│
└─────────────────────────────────────────────────────────────────┘
```

**Implementación:** `app/api/compress/route.ts`

---

## 3. Algoritmos y técnicas por función

### 3.1 Redimensionado e interpolación

| Algoritmo | Uso | Parámetros |
|-----------|-----|------------|
| **Lanczos3** | Resize, upscale 2x/4x, contain/cover | `kernel: sharp.kernel.lanczos3` |
| **Fit: inside** | Encajar sin recortar, sin agrandar | `withoutEnlargement: true` |
| **Fit: cover** | Llenar marco recortando bordes | `position` según gravedad (center, entropy, attention…) |
| **Fit: contain** | Imagen centrada con relleno | Composición sobre fondo blur o color sólido |

**Lanczos3** es un filtro de remuestreo de 3 lobos que preserva bordes mejor que bilinear/bicúbico simple. Es el estándar de facto para downscaling de calidad en producción.

### 3.2 Fondo blur (modo Contain / Historias 9:16)

Técnica de **blur cinemático acelerado**:

1. Reducir imagen a **1/4** de resolución (`targetW/4`, mínimo 160px)
2. Aplicar `blur(14)` en baja resolución (coste O(n) mucho menor)
3. Reescalar al tamaño del lienzo con `fit: cover`
4. Modular brillo/saturación (`brightness: 0.65`, `saturation: 1.15`)
5. Componer imagen principal encima con `composite()`

Esto genera fondos tipo Instagram Stories sin procesar blur a resolución completa.

### 3.3 Claridad HD

| Operación | Algoritmo | Parámetros |
|-----------|-----------|------------|
| Nitidez | **Unsharp masking** (Sharp `.sharpen()`) | `sigma: 1.2, m1: 1.6, m2: 0.7` |
| Denoise | **Median filter** | `median(1)` — radio 1px |

Se aplica **después** del resize y **antes** de la codificación final, para recuperar percepción de nitidez cuando la compresión agresiva suaviza bordes.

### 3.4 Codificación por formato

| Formato | Motor / códec | Parámetros clave |
|---------|--------------|------------------|
| **JPEG** | mozjpeg (libjpeg-turbo optimizado) | `mozjpeg: true`, `chromaSubsampling: '4:2:0'` |
| **WebP** | libwebp | `quality`, `effort: 6` en modo alta fidelidad |
| **AVIF** | libavif | `quality`, `effort: 6` |
| **PNG** | libpng | `compressionLevel: 9`, `palette: true` si quality < 100 |
| **TIFF** | libtiff | `compression: 'deflate'` |
| **HEIC** | libheif | `compression: 'hevc'` |

**Chroma subsampling 4:2:0:** reduce información de color (no luminancia) a la mitad en cada eje. Imperceptible en fotos, ~30–40% menos peso en JPEG.

**mozjpeg:** optimizador de tablas Huffman y codificación progresiva de JPEG; produce archivos más pequeños que libjpeg clásico a igual calidad visual.

### 3.5 Modos de compresión (Etapa 2)

#### A) Sin Pérdida (`preserveQuality: true`)

```
Si NO hay transformaciones visuales Y formato = original:
  ├─ stripExif = false → devolver buffer original sin tocar
  └─ stripExif = true  → sharp(input).toBuffer()  ← ver sección 4
Si SÍ hay transformaciones:
  └─ Codificar a ~95% (JPEG/WebP) o compressionLevel 9 (PNG)
```

#### B) Calidad fija % (`quality: 1–100`)

Codificación directa al porcentaje indicado. Un solo paso, sin bucle.

#### C) Límite KB (`maxKB`, modo por defecto en presets)

**Algoritmo iterativo:**

```
quality ← 90
MIENTRAS quality >= 15:
  codificar imagen con quality actual
  SI tamaño <= min(maxKB, originalSize × 0.95):
    BREAK
  quality ← quality - 5
```

- Paso de **5 puntos** por iteración
- Mínimo **quality 15**
- Si PNG no alcanza el objetivo y formato es `original`, **convierte automáticamente a JPG**
- Objetivo efectivo: `min(maxKB, 95% del peso original)` salvo conversión a PNG/TIFF

---

## 4. Por qué 2.5 MB puede bajar a ~400 KB (la respuesta directa)

> **No es “solo quitar metadatos”.** En casi todos los casos hay **re-codificación de píxeles** y/o **eliminación de datos auxiliares que no son visibles en pantalla**.

### 4.1 Qué pesa en un archivo “grande”

Un JPEG/PNG de 2.5 MB puede estar compuesto por:

| Componente | Típico peso | ¿Visible al ver la imagen? |
|-----------|-------------|---------------------------|
| **Datos de píxeles comprimidos** | 300 KB – 2 MB | Sí |
| **EXIF** (cámara, lente, GPS) | 10 – 100 KB | No |
| **Miniatura embebida EXIF** | 50 – 500 KB | No (JPEG incrustado dentro del EXIF) |
| **Perfil ICC de color** | 10 – 500 KB | No (solo afecta interpretación de color) |
| **XMP / IPTC** | 5 – 50 KB | No |
| **Chunks PNG de texto (IA)** | **500 KB – varios MB** | No |
| **Codificación JPEG ineficiente** (q=98+, sin optimización) | +30–60% vs mozjpeg q=80 | Casi imperceptible |

### 4.2 Caso A — Foto de cámara/móvil (JPEG)

Configuración típica: **Sin Pérdida + EXIF eliminado (default)**.

Código ejecutado (`route.ts` líneas 360–366):

```typescript
if (!stripExif) {
  finalBuffer = inputBuffer;           // Sin cambios
} else {
  finalBuffer = await sharp(inputBuffer).toBuffer();  // ← Re-codifica
}
```

**Qué hace `sharp(input).toBuffer()` realmente:**

1. **Decodifica** el JPEG completo a píxeles RGB en memoria
2. **Elimina** EXIF, IPTC, XMP, miniaturas embebidas, perfiles ICC
3. **Re-codifica** el JPEG con los defaults de Sharp/libvips (quality ~80, optimización estándar)

Un JPEG de cámara a **quality 95–98** sin optimizar puede pesar **2–3× más** que el mismo contenido visual a **quality 80** con mozjpeg + 4:2:0. Eso explica reducciones de **2.5 MB → 600–900 KB** sin cambiar resolución.

Si además el preset usa **Límite KB = 200** o **WebP**, llegar a **~400 KB** es esperado y correcto.

### 4.3 Caso B — Imagen generada por IA (PNG)

Muy común en Web-Sling: PNG de 1024×1024 o 2048×2048 con:

- Píxeles: ~400–800 KB
- Chunk `parameters` / `prompt` (Stable Diffusion, ComfyUI, A1111): **1–5 MB de texto**

Al pasar por Sharp:

1. Solo se conservan los **píxeles**
2. Los chunks `tEXt`, `iTXt`, `zTXt` se **descartan** (no forman parte del bitmap)
3. Si se exporta a JPEG/WebP o PNG optimizado → **2.5 MB → 400 KB es normal**

Esto es lo que más sorprende: **el 80% del archivo era texto de metadatos de generación**, no imagen.

### 4.4 Caso C — Modo Límite KB activo

Con `maxKB: 200` (preset E-commerce) o `maxKB: 400`:

- El bucle baja quality de 90 → 85 → 80 → … hasta cumplir el objetivo
- Puede combinar con resize a 800px + WebP
- **400 KB es el objetivo explícito**, no un efecto secundario

### 4.5 Caso D — Pre-compresión en navegador (>4.1 MB)

`clientPreCompress.ts`:

1. Redimensiona a máximo **4096 px** si es necesario
2. Re-exporta vía Canvas a JPEG q=0.92 (o q=0.85 si aún es grande)
3. Extrae JPEG embebido de archivos RAW (DNG, CR2, NEF…)

Un RAW de 40 MB puede convertirse en JPEG de 3 MB **antes** de llegar al servidor.

---

## 5. Tabla de decisión: qué operación reduce qué

| Operación | Reduce píxeles | Reduce metadatos | Re-codifica | Reducción típica |
|-----------|:-:|:-:|:-:|------------------|
| Quitar EXIF (buffer original intacto) | | ✓ | | 1–5% |
| `sharp().toBuffer()` en Sin Pérdida | | ✓ | ✓ | 20–70% |
| Resize (ej. 4000→800px) | ✓ | ✓ | ✓ | 60–90% |
| JPEG q98 → q80 (mozjpeg) | | ✓ | ✓ | 30–50% |
| PNG → WebP q80 | ✓ | ✓ | ✓ | 50–80% |
| Modo Límite KB 200 | ✓ | ✓ | ✓ | Hasta objetivo |
| Eliminar chunks PNG de IA | | ✓ | ✓ | 50–95% |

---

## 6. Salvaguardas de calidad

El sistema **no entrega un archivo más pesado** sin motivo:

```typescript
// Si no hubo transformaciones y el resultado es más grande → original
if (!hasVisualTransforms && finalBuffer.length >= originalSize) {
  finalBuffer = inputBuffer;
  quality = 100;
}
```

Esto protege contra re-codificaciones contraproducentes cuando `stripExif = false`.

---

## 7. Parámetros exactos del código fuente

### Transformaciones (Etapa 1)

| Función | Archivo | Líneas |
|---------|---------|--------|
| Pipeline principal | `app/api/compress/route.ts` | 201–315 |
| Lanczos3 resize | idem | 233–236, 277–285, 292–295 |
| Blur background | idem | 241–257 |
| Claridad HD | idem | 298–303 |
| Buffer intermedio PNG | idem | 315 |

### Codificación (Etapa 2)

| Modo | Archivo | Líneas |
|------|---------|--------|
| Calidad % | `app/api/compress/route.ts` | 339–356 |
| Sin Pérdida | idem | 357–387 |
| Límite KB (bucle) | idem | 388–419 |

### Cliente

| Función | Archivo |
|---------|---------|
| Pre-compresión Canvas | `utils/clientPreCompress.ts` |
| Orquestación + FormData | `hooks/useImageProcessor.ts` |
| Extracción metadatos (lectura) | `utils/metadataExtractor.ts` |

---

## 8. Cómo verificar qué pasó con TU imagen

En la UI, revisa:

1. **Modo de calidad activo** — ¿Sin Pérdida, Calidad %, o Límite KB?
2. **Columna Calidad** — Muestra el `%` real aplicado (ej. `80% (JPG)`)
3. **Columna Dimensiones** — ¿Cambió resolución o upscale?
4. **Inspeccionar Metadatos** (botón ℹ️ morado) — ¿Tenía chunks de IA, EXIF grande, miniatura embebida?
5. **Formato** — ¿Original, WebP, AVIF?

### Regla práctica

| Ves en UI | Lo que probablemente pasó |
|-----------|--------------------------|
| `100% (PNG)` mismo tamaño, `-0%` | Casi sin cambios (original devuelto) |
| `100% (JPG)` pero `-60%` peso | Re-codificación + metadatos eliminados en modo Sin Pérdida |
| `75% (WEBP)` + dimensiones menores | Resize + WebP + bucle KB |
| Badge `⚡ Auto-adaptado` | Pre-compresión cliente antes del servidor |

---

## 9. Glosario técnico

| Término | Definición |
|---------|-----------|
| **libvips** | Biblioteca C de procesamiento de imagen por demanda (no carga imagen completa si no es necesario) |
| **Sharp** | API Node.js sobre libvips |
| **mozjpeg** | Fork de libjpeg optimizado para menor tamaño a igual SSIM |
| **Lanczos3** | Filtro de remuestreo con ventana de 3 lobos |
| **Unsharp masking** | Nitidez = original + (original − blurred) × amount |
| **Chroma 4:2:0** | Submuestreo de canal de color en JPEG |
| **EXIF** | Metadatos binarios embebidos en JPEG/TIFF (no en pixels) |
| **PNG text chunks** | Metadatos de texto en PNG (común en imágenes IA) |
| **SSIM** | Structural Similarity Index — métrica de similitud visual |

---

## 10. Resumen ejecutivo

**Web-Sling Optimizer** usa **Sharp/libvips** con un pipeline de **2 etapas** (transformar → codificar) y **3 modos de calidad**.

La reducción **2.5 MB → 400 KB** casi nunca es “solo metadatos”. Lo habitual es una combinación de:

1. **Eliminación de datos no visuales** (EXIF, miniaturas, perfiles ICC, prompts de IA en PNG)
2. **Re-codificación** con códec más eficiente (mozjpeg, WebP, AVIF)
3. **Reducción de quality** (explícita o por bucle Límite KB)
4. **Redimensionado** (presets E-commerce, pre-compresión cliente)

El modo **Sin Pérdida** preserva la **fidelidad visual**, pero con **EXIF eliminado (default)** igual re-codifica el archivo para limpiarlo — y eso puede reducir el peso drásticamente sin que el usuario lo perciba como “compresión agresiva”.

---

*Documento generado para Web-Sling Optimizer. Referencia de implementación: `app/api/compress/route.ts`.*
