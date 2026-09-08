Listed directory websling
Viewed package.json:1-34
Listed directory types
Viewed image.ts:1-80
Viewed ImageTable.tsx:1-120
Viewed ImageTable.tsx:121-173
Viewed page.tsx:1-150
Viewed page.tsx:151-300
Listed directory app
Listed directory api
Viewed route.ts:1-120
Viewed route.ts:121-246
Viewed whosnext.md:1-80
Listed directory components
Viewed SrcsetModal.tsx:1-70
Viewed ImageGrid.tsx:1-89
Searched for "customNamePattern"
Searched for "customName"
Searched for "customNamePattern"
Viewed SettingsPanel.tsx:550-620
Searched for "downloadAll"
Searched for "JSZip"
Viewed page.tsx:340-450
Viewed page.tsx:500-708

Es una excelente visión estratégica para **Web-Sling-Optimizer**. El renombrado semántico y el texto `alt` son los dos factores de **SEO de imágenes y accesibilidad** más descuidados en la web, y combinarlos con la compresión que ya hace la app crea un producto de nivel profesional.

A continuación te presento el desglose técnico, la propuesta del LLM ideal y cómo podemos mejorar la interfaz y la ingeniería ahora mismo.

---

### 1. El LLM Multimodal: Diagnóstico y Recomendación

Para esta tarea específica, el modelo necesita cumplir 4 condiciones:
1. **Multimodalidad nativa con visión rápida**: Interpretar lo que hay en la imagen (objetos, colores, contexto, texto si lo hay).
2. **Ventana de contexto ligera y latencia ultra-baja**: Respuestas en menos de 1 segundo por imagen.
3. **Salida estructurada JSON**: Para devolver `{ slug, altText, title, tags }` de forma determinista y sin rodeos.
4. **Costo mínimo o nulo**: Ideal para procesar lotes de 10 a 50 imágenes sin preocuparse por la factura.

#### 🏆 Candidato recomendado: **Google Gemini 1.5 Flash / 2.0 Flash** (vía Google AI Studio API)
* **Por qué es el mejor**:
  - **Velocidad y latencia**: Es uno de los modelos multimodales más veloces del mercado.
  - **Precio**: Cuenta con un **Free Tier gratuito** muy generoso en Google AI Studio (hasta 15 RPM sin costo), y luego fracciones de centavos por millón de tokens.
  - **Optimización de tokens**: Podemos redimensionar un thumbnail ligero (ej. 512px) antes de enviarlo, reduciendo drásticamente el consumo de tokens y el tiempo de red.
  - **Conversacional y con contexto**: Permite una directiva previa del usuario (ej: *"Somos una tienda de calzado deportivo en Argentina, enfócate en el modelo y color"*) o refinamiento (*"haz los nombres más cortos"*).

*(Alternativa secundaria: **GPT-4o-mini** de OpenAI, también muy rápido y económico, aunque con menor cuota gratuita).*

---

### 2. Enfoque Actual: Por Ingeniería y Manual (Offline / Sin API)

Antes de forzar una API externa, podemos resolver el **80% del trabajo** de inmediato con ingeniería pura:

1. **Slugificador SEO Algorítmico**:
   - Limpieza de acentos y tildes (`á` $\to$ `a`, `ñ` $\to$ `n`).
   - Kebab-case estricto (`Foto Producto_1 (Final).png` $\to$ `foto-producto-1-final.webp`).
   - Eliminación de stop-words opcional o caracteres basura (`screenshot-2024...`).
2. **Generador Automático de Alt Text por Heurística**:
   - Deducir un texto `alt` natural y legible desde el nombre de archivo limpio (ej. `zapatillas-running-rojas` $\to$ `Zapatillas running rojas`).
3. **Reglas en Lote**:
   - Prefijo / Sufijo masivo (ej. agregar `tienda-mi-marca-`).
   - Buscar y reemplazar (ej. cambiar `IMG_` por `verano-`).
   - Numeración secuencial (`-01`, `-02`).
4. **Exportación de Metadatos**:
   - Incluir un `metadata.json` o `metadata.csv` en el `.ZIP` descargado, listo para importar en WordPress, Shopify o headless CMS.
   - Incorporar el `alt` real directamente en el generador de `<picture>` y `srcset`.

---

### 3. Mejoras para la Interfaz (UI / UX)

Para que esto sea intuitivo y rápido de usar, propongo las siguientes mejoras inmediatas en la UI:

1. **Nueva Columna y Edición de Metadatos en la Tabla/Grid**:
   - Campo editable para el **Nombre de Archivo SEO** con detector de errores (te avisa si tiene espacios, mayúsculas o caracteres no válidos para URLs).
   - Campo editable para el **Texto Alt** con indicador de longitud recomendada (badge verde/amarillo: óptimo 50–125 caracteres según estándares WCAG y Google SEO).
2. **Barra de Acciones Rápidas de Metadatos (Batch Toolbar)**:
   - Botón **"Varita SEO"**: Aplica slugify automático a todo el lote y genera el texto alt inicial.
   - Botón **"Reglas Masivas"**: Modal emergente para prefijos, reemplazos y plantillas.
3. **Preparación para IA (Botón ✨ IA)**:
   - Un botón de acción en cada fila y a nivel lote: *"Generar Alt & Nombre con IA"*.
   - Panel/Drawer de configuración para ingresar la API Key (guardada de forma segura en `localStorage` del navegador), seleccionar idioma y añadir contexto del sitio web.

---

¿Te gustaría que comencemos implementando las **mejoras de la interfaz y el motor de renombrado/alt text manual y por ingeniería**, dejando además preparada la arquitectura del endpoint/interfaz para conectar la API del LLM multimodal?