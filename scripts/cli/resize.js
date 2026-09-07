const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

// Extensiones de imagen soportadas por sharp
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.bmp', '.gif'];

function resolveFilePath(filePath) {
  if (path.isAbsolute(filePath)) return filePath;
  const fromCwd = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromDir = path.resolve(__dirname, filePath);
  if (fs.existsSync(fromDir)) return fromDir;
  return fromCwd;
}

function parseDimensions(inputStr, originalWidth, originalHeight) {
  if (!inputStr || inputStr.trim() === '' || inputStr.trim().toLowerCase() === 'original') {
    return { width: originalWidth || 1280, height: originalHeight || 600 };
  }

  const str = inputStr.trim().toLowerCase();

  // Formato Ancho x Alto (ej: 1280x600, 1920x1080)
  if (str.includes('x')) {
    const parts = str.split('x').map(n => parseInt(n.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { width: parts[0], height: parts[1] };
    }
  }

  // Formato Aspect Ratio (ej: 16:9, 4:3, 1:1)
  if (str.includes(':')) {
    const parts = str.split(':').map(n => parseFloat(n.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] > 0) {
      const baseWidth = originalWidth || 1280;
      const calculatedHeight = Math.round(baseWidth * (parts[1] / parts[0]));
      return { width: baseWidth, height: calculatedHeight };
    }
  }

  // Solo ancho especificado (mantiene el aspect ratio original si se pasa un ancho)
  const singleNum = parseInt(str, 10);
  if (!isNaN(singleNum)) {
    if (originalWidth && originalHeight) {
      const aspect = originalHeight / originalWidth;
      return { width: singleNum, height: Math.round(singleNum * aspect) };
    }
    return { width: singleNum, height: 600 };
  }

  return { width: originalWidth || 1280, height: originalHeight || 600 };
}

async function resizeImage({ inputPath, outputName, dimensionsStr, maxKB }) {
  const absoluteInputPath = resolveFilePath(inputPath);

  if (!fs.existsSync(absoluteInputPath)) {
    console.error(`\n❌ Error: El archivo "${absoluteInputPath}" no existe.`);
    return false;
  }

  let metadata;
  try {
    metadata = await sharp(absoluteInputPath).metadata();
  } catch (err) {
    console.error(`\n❌ Error leyendo la imagen. ¿Es un formato válido de imagen?`, err.message);
    return false;
  }

  const { width, height } = parseDimensions(dimensionsStr, metadata.width, metadata.height);
  const maxSizeBytes = maxKB * 1024;

  // Determinar extensión de salida
  let ext = path.extname(outputName).toLowerCase();
  let baseName = outputName;
  if (ext) {
    baseName = path.basename(outputName, ext);
  } else {
    ext = path.extname(inputPath).toLowerCase() || '.jpg';
    if (ext === '.jpeg') ext = '.jpg';
  }

  const targetFileName = `${baseName}${ext}`;
  const dirName = path.dirname(absoluteInputPath);
  const outputPath = path.join(dirName, targetFileName);

  console.log(`\n⚙️  Procesando imagen...`);
  console.log(`   📂 Entrada: ${path.basename(absoluteInputPath)} (${metadata.width}x${metadata.height}px, ${metadata.format})`);
  console.log(`   📄 Salida: ${targetFileName}`);
  console.log(`   📐 Dimensiones objetivo: ${width}x${height}px`);
  console.log(`   📦 Límite máximo: ${maxKB} KB`);

  let quality = 90;
  let buffer;
  let format = ext.replace('.', '');
  if (format === 'jpg') format = 'jpeg';

  while (quality >= 10) {
    let pipeline = sharp(absoluteInputPath).resize(width, height, {
      fit: 'cover',
      position: 'center'
    });

    if (format === 'png') {
      buffer = await pipeline.png({ quality, compressionLevel: 9, palette: true }).toBuffer();
    } else if (format === 'webp') {
      buffer = await pipeline.webp({ quality }).toBuffer();
    } else if (format === 'avif') {
      buffer = await pipeline.avif({ quality }).toBuffer();
    } else {
      buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    if (buffer.length <= maxSizeBytes) {
      break;
    }
    quality -= 5;
  }

  // Fallback si PNG excede el peso máximo permitido
  if (buffer.length > maxSizeBytes && format === 'png') {
    console.log(`\n⚠️  El formato PNG superó los ${maxKB} KB incluso en compresión máxima.`);
    console.log(`   Convirtiendo automáticamente a JPG para cumplir el límite de tamaño...`);
    return resizeImage({
      inputPath: absoluteInputPath,
      outputName: `${baseName}.jpg`,
      dimensionsStr: `${width}x${height}`,
      maxKB
    });
  }

  await fs.promises.writeFile(outputPath, buffer);
  const finalKB = (buffer.length / 1024).toFixed(2);

  console.log(`\n==========================================`);
  console.log(`  ✅ ¡IMAGEN PROCESADA CON ÉXITO!`);
  console.log(`==========================================`);
  console.log(`   📍 Guardada en: ${outputPath}`);
  console.log(`   📐 Dimensiones: ${width}x${height}px`);
  console.log(`   🎚️  Calidad aplicada: ${quality}%`);
  console.log(`   📦 Tamaño final: ${finalKB} KB (${buffer.length} bytes)\n`);
  return true;
}

async function runInteractive() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log(`\n==============================================`);
    console.log(`  📸 OPTIMIZADOR Y REGENERADOR DE IMÁGENES `);
    console.log(`==============================================\n`);

    // Listar imágenes en la carpeta actual (cwd) y la del script (__dirname)
    const dirsToScan = Array.from(new Set([process.cwd(), __dirname]));
    let localFiles = [];

    dirsToScan.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(file => {
          const ext = path.extname(file).toLowerCase();
          return SUPPORTED_EXTENSIONS.includes(ext);
        }).map(f => path.resolve(dir, f));
        localFiles = localFiles.concat(files);
      }
    });

    // Eliminar duplicados
    localFiles = Array.from(new Set(localFiles));

    if (localFiles.length === 0) {
      console.log(`❌ No se encontraron imágenes (${SUPPORTED_EXTENSIONS.join(', ')}) en la carpeta actual.`);
      rl.close();
      return;
    }

    // 1. SELECCIÓN DE IMAGEN
    console.log(`📋 Paso 1: Selecciona la imagen a procesar:`);
    localFiles.forEach((filePath, index) => {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const fileName = path.basename(filePath);
      console.log(`  [${index + 1}] ${fileName} (${sizeKB} KB)`);
    });
    console.log('');

    let fileChoice = await rl.question('👉 Número de la imagen (o escribe el nombre/ruta): ');
    fileChoice = fileChoice.trim();

    let selectedInputPath = '';
    const fileIndex = parseInt(fileChoice, 10);
    if (!isNaN(fileIndex) && fileIndex >= 1 && fileIndex <= localFiles.length) {
      selectedInputPath = localFiles[fileIndex - 1];
    } else if (fileChoice) {
      selectedInputPath = resolveFilePath(fileChoice);
    }

    if (!selectedInputPath || !fs.existsSync(selectedInputPath)) {
      console.log('❌ Selección de imagen no válida o archivo inexistente.');
      rl.close();
      return;
    }

    const metadata = await sharp(selectedInputPath).metadata();
    console.log(`  ↳ Imagen elegida: ${path.basename(selectedInputPath)} (${metadata.width}x${metadata.height}px)`);

    // 2. SELECCIÓN DE RATIO / DIMENSIONES (Por defecto: mantener el original)
    console.log(`\n📐 Paso 2: Selecciona las dimensiones o ratio:`);
    console.log(`  [1] Mantener dimensiones y ratio original (${metadata.width}x${metadata.height}px)`);
    console.log(`  [2] 1280x600 (Banner)`);
    console.log(`  [3] 16:9 (Panorámico HD)`);
    console.log(`  [4] 4:3 (Estándar)`);
    console.log(`  [5] 1:1 (Cuadrado)`);
    console.log(`  [6] Personalizado (escribir dimensiones o ratio)`);

    let ratioChoice = await rl.question(`👉 Elige opción [1-6] o escribe directamente [Default: Mantener original (${metadata.width}x${metadata.height}px)]: `);
    ratioChoice = ratioChoice.trim();

    let dimensionsStr = 'original';
    if (ratioChoice === '' || ratioChoice === '1') {
      dimensionsStr = 'original';
    } else if (ratioChoice === '2') {
      dimensionsStr = '1280x600';
    } else if (ratioChoice === '3') {
      dimensionsStr = '16:9';
    } else if (ratioChoice === '4') {
      dimensionsStr = '4:3';
    } else if (ratioChoice === '5') {
      dimensionsStr = '1:1';
    } else if (ratioChoice === '6') {
      const customDim = await rl.question('   Escribe el ancho x alto o ratio (ej: 1920x1080): ');
      dimensionsStr = customDim.trim() || 'original';
    } else {
      dimensionsStr = ratioChoice;
    }

    // 3. SELECCIÓN DE TAMAÑO MÁXIMO (KB)
    console.log(`\n📦 Paso 3: Define el tamaño máximo límite en KB:`);
    let maxKBChoice = await rl.question('👉 Tamaño máximo en KB [Default: 200]: ');
    const maxKB = parseFloat(maxKBChoice.trim()) || 200;

    // 4. SELECCIÓN DE NOMBRE DE SALIDA
    console.log(`\n🏷️  Paso 4: Ingresa el nombre de la imagen de salida:`);
    const defaultOutputName = `${path.basename(selectedInputPath, path.extname(selectedInputPath))}-resized`;
    let outputNameChoice = await rl.question(`👉 Nombre de salida (ej: "panes recién horneados") [Default: ${defaultOutputName}]: `);
    const outputName = outputNameChoice.trim() || defaultOutputName;

    rl.close();

    await resizeImage({
      inputPath: selectedInputPath,
      outputName,
      dimensionsStr,
      maxKB
    });
  } catch (err) {
    console.error('Error en consola:', err);
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length >= 1) {
    const inputPath = args[0];
    const outputName = args[1] || `${path.basename(inputPath, path.extname(inputPath))}-resized`;
    const dimensionsStr = args[2] || 'original';
    const maxKB = parseFloat(args[3]) || 200;

    await resizeImage({ inputPath, outputName, dimensionsStr, maxKB });
  } else {
    await runInteractive();
  }
}

main();
