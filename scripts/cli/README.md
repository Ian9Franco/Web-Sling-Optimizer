# Herramientas CLI de Web Sling Optimizer

Esta carpeta contiene utilidades de consola standalone para procesar imágenes localmente sin necesidad de levantar el servidor web de Next.js.

## Scripts disponibles

### 1. Compresión Interactiva (`resize.js`)
Herramienta interactiva por terminal que guía paso a paso para redimensionar y comprimir una imagen o lote con opciones de dimensiones personalizadas, aspect ratio y peso objetivo.

Ejecución:
```bash
npm run cli
# o directamente:
node scripts/cli/resize.js
```

### 2. Compresión por Lote de Carpeta (`batch-resize.js`)
Procesa automáticamente todas las imágenes ubicadas en una carpeta `imgs/` y guarda las versiones optimizadas en `imgs_resized/`, asegurando que no superen el límite de peso configurado (por defecto 200 KB).

Ejecución:
```bash
npm run cli:batch
# o directamente:
node scripts/cli/batch-resize.js
```
