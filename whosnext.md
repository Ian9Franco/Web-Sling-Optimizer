Features nuevas para Web-Sling-Optimizer

Compresión y calidad

Comparación lado a lado (before/after con slider) en el preview, mostrando peso y calidad simultáneamente — hoy solo se ve la imagen final.
Modo "target visual" en vez de solo KB: dejar elegir un SSIM/perceptual quality mínimo (usando algo como sharp + una métrica simple) para no sacrificar calidad visible solo por cumplir el KB exacto.
Presets de compresión por caso de uso (Web hero, thumbnail, email, redes sociales) que combinen formato + maxKB + resize en un solo click, en vez de configurar todo manualmente.

Batch y flujo de trabajo

Perfiles de exportación guardables (localStorage): que Ian pueda guardar "mi config para Instagram" o "mi config para el blog" y reusarla sin reconfigurar cada vez.
Renombrado en batch con patrones ({original}-{index}, {original}-{width}x{height}) en vez de un solo customName fijo para todo el lote.
Cola de procesamiento con concurrencia limitada en vez de for secuencial — hoy cada imagen espera a la anterior; con Promise.all + límite de 3-4 en paralelo el batch grande sería notablemente más rápido.

Formatos y compatibilidad

Exportar <picture> / srcset listo para copiar: generar automáticamente 2-3 tamaños (ej. 400w/800w/1200w) + el snippet HTML, pensado para gente que después pega esto directo en su sitio.
Soporte SVG optimization (con SVGO) — hoy solo trabaja con raster; si el target es gente armando sitios web, SVG es un pedido común.
Conversión a WebP/AVIF con fallback JPG automático en el mismo ZIP, para no tener que correr el proceso dos veces si quieren servir ambos formatos.

Favicons / branding

Generar también og:image / social card (1200x630) junto con los favicons, ya que es el mismo flujo de "subí un logo, dame variantes".
Preview del manifest.json y las meta tags <link> listas para copiar/pegar, no solo el JSON crudo.

Producto / distribución

Modo API pública con API key (rate-limited): dado que ya tiene el endpoint hecho, exponerlo como servicio para otros devs sería un paso natural y diferenciador frente a herramientas tipo TinyPNG.
Historial de sesión persistente (IndexedDB) para no perder el trabajo si se recarga la página a mitad de un batch grande.

Si tuviera que priorizar por impacto/esfuerzo: cola con concurrencia, presets guardables y exportar srcset son las tres que más valor agregan con menos trabajo, dado el código que ya existe.

Sin DB, cero problema:

Comparación before/after (slider) → solo UI
Presets de compresión por caso de uso → config hardcodeada en el frontend
Renombrado batch con patrones → lógica pura, sin persistencia
Cola con concurrencia limitada → solo cambia el for secuencial por Promise.all con límite
Exportar srcset / <picture> → generás los tamaños y armás el string HTML, nada se guarda
SVG optimization (SVGO) → misma arquitectura que ahora, otra lib en el mismo endpoint
WebP/AVIF con fallback en el mismo ZIP → mismo pipeline, solo generás dos buffers en vez de uno
Favicon + og:image + preview de manifest/meta tags → mismo endpoint de favicons, más variantes

"Guardable" pero sin servidor:

Perfiles de exportación guardables → localStorage, no toca el server
Historial de sesión persistente → IndexedDB en el navegador, tampoco es DB de servidor

Privacidad / procesamiento (el gran diferenciador de Squoosh)

Modo 100% cliente con WASM (@squoosh/lib o wasm-vips): hoy todo se sube al servidor. Squoosh procesa todo en el navegador — nada sale de la máquina del usuario. Ofrecer esto como opción ("Procesar localmente" vs "Procesar en servidor para archivos grandes") es un argumento de venta fuerte, sobre todo para gente con imágenes sensibles.
Visor de metadata EXIF antes de decidir si stripear — mostrar qué datos tiene la imagen (GPS, cámara, fecha) en vez de solo un toggle ciego "eliminar sí/no".

Comparación y control fino (fuerte en Squoosh)

Vista dual con dos codecs/calidades lado a lado y zoom sincronizado, no solo un slider before/after — permite decidir visualmente entre webp-80 vs avif-60, por ejemplo.
Auto-detección del mejor formato: analizar la imagen (foto vs ilustración/flat colors) y sugerir automáticamente WebP vs AVIF vs PNG, como hace Squoosh con su heurística.

Formatos de entrada/salida (fuerte en iLoveIMG/CloudConvert)

Soporte HEIC/HEIF — muy pedido porque son las fotos nativas de iPhone y hoy nadie las puede subir directo.
Conversión imagen ↔ PDF — iLoveIMG vive de combos tipo "convertí estas fotos a un PDF" o "extraé imágenes de un PDF"; es un flujo de trabajo real y complementario.

Ergonomía de uso (fuerte en Squoosh y ShareX)

Pegar imagen desde portapapeles (Ctrl+V) — nadie tiene que guardar el archivo primero, solo capturan pantalla y pegan.
Importar por URL (pegar un link y que el server la descargue y procese).
Watermark con imagen/logo, no solo texto — el actual solo soporta texto en SVG; un logo PNG semitransparente es lo que realmente pide la mayoría.
Links de configuración compartibles: codificar los settings actuales en la URL para mandarle a alguien "usá esta config" con un click.

Batch / productividad (fuerte en TinyPNG)

Extensión de navegador o bookmarklet para comprimir imágenes sin salir de la página donde las encontraste.
Preservar estructura de carpetas al exportar ZIP si se arrastró una carpeta con subcarpetas (hoy probablemente aplana todo).
Plugin/integración CMS (WordPress, Webflow) — TinyPNG vive en gran parte de esto.

Alcance / internacionalización

i18n real — iLoveIMG está en decenas de idiomas, esta app está solo en español; si el target es developers a nivel global, inglés como default con selector de idioma suma mucho.
