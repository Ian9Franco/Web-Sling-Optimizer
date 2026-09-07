const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_DIR = path.join(__dirname, 'imgs');
const OUTPUT_DIR = path.join(__dirname, 'imgs_resized');
const MAX_KB = 200;        // Límite estricto de peso (200 KB)
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp'];

async function processImages() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`❌ La carpeta de origen "${INPUT_DIR}" no existe.`);
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  if (files.length === 0) {
    console.log(`⚠️ No se encontraron imágenes en "${INPUT_DIR}".`);
    return;
  }

  console.log(`====================================================`);
  console.log(`🚀 COMPRESOR DE IMÁGENES (SIN REDIMENSIONAR)`);
  console.log(`====================================================`);
  console.log(`📏 Dimensiones: Mantener originales`);
  console.log(`📦 Peso máximo permitido: ${MAX_KB} KB por imagen`);
  console.log(`📁 Destino: ${OUTPUT_DIR}\n`);

  let count = 0;

  for (const file of files) {
    const inputFilePath = path.join(INPUT_DIR, file);
    let ext = path.extname(file).toLowerCase();
    let baseName = path.basename(file, ext);

    try {
      const metadata = await sharp(inputFilePath).metadata();
      const orientation = metadata.width > metadata.height ? 'Horizontal' : (metadata.width < metadata.height ? 'Vertical' : 'Cuadrada');

      let quality = 90;
      let buffer;
      let targetExt = ext;

      // Intentar compresión iterativa para no superar los 200 KB
      while (quality >= 15) {
        let pipeline = sharp(inputFilePath);

        if (targetExt === '.png') {
          // Intentar primero paleta PNG indexada
          buffer = await pipeline.png({ quality, compressionLevel: 9, palette: true }).toBuffer();
          // Si PNG sigue superando los 200KB (típico en fotografías en PNG sin transparencia),
          // convertimos automáticamente a JPG de alta calidad para cumplir los 200KB
          if (buffer.length > MAX_KB * 1024) {
            targetExt = '.jpg';
            continue;
          }
        } else if (targetExt === '.webp') {
          buffer = await pipeline.webp({ quality }).toBuffer();
        } else {
          // Formato JPG / JPEG
          buffer = await pipeline.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
        }

        if (buffer.length <= MAX_KB * 1024) {
          break; // ¡Logrado! Peso <= 200 KB
        }

        quality -= 5; // Reducir calidad ligeramente hasta entrar en < 200 KB
      }

      let index = count + 1;
      const outputFileName = `${baseName}${targetExt}`;
      const outputFilePath = path.join(OUTPUT_DIR, outputFileName);
      await fs.promises.writeFile(outputFilePath, buffer);

      const finalKB = (buffer.length / 1024).toFixed(1);
      const isConvertedNotice = targetExt !== ext ? ` (convertida a JPG para cumplir < ${MAX_KB}KB)` : '';

      console.log(`✅ [${++count}/${files.length}] ${outputFileName}${isConvertedNotice}`);
      console.log(`   Original: ${metadata.width}x${metadata.height}px (${orientation})`);
      console.log(`   Peso final: ${finalKB} KB | Calidad: ${quality}%`);
      console.log(`   Estado: ${parseFloat(finalKB) <= MAX_KB ? 'Cumple (<= 200 KB)' : '⚠️ Excede'}\n`);

    } catch (err) {
      console.error(`❌ Error procesando ${file}:`, err.message);
    }
  }

  console.log(`====================================================`);
  console.log(`🎉 ¡Proceso finalizado! ${count} imágenes procesadas.`);
  console.log(`====================================================`);
}

processImages();
