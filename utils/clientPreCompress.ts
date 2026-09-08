import { extractEmbeddedJpegFromRaw, RAW_CAMERA_REGEX } from './supportedFormats';

/**
 * Límite seguro para Vercel Serverless Functions (4.1 MB)
 * Deja un margen de seguridad de 400 KB sobre el límite estricto de 4.5 MB.
 */
const MAX_SERVERLESS_SAFE_BYTES = 4.1 * 1024 * 1024;

/**
 * Pre-comprime en el navegador (client-side) cualquier imagen que supere 4.1 MB
 * para asegurar que nunca exceda el límite de carga útil (4.5 MB) de Vercel Serverless.
 * Para archivos RAW de cámara (DNG, CR2, NEF, etc.), extrae la vista previa JPEG interna de alta resolución.
 */
export async function clientPreCompress(file: File | Blob, originalName?: string): Promise<File> {
  const fileName = originalName || (file instanceof File ? file.name : 'image.jpg');

  // Si ya es menor al umbral seguro, no tocar nada
  if (file.size <= MAX_SERVERLESS_SAFE_BYTES) {
    if (file instanceof File) return file;
    return new File([file], fileName, { type: file.type || 'image/jpeg' });
  }

  // Si estamos en un entorno sin DOM (ej. SSR / tests), retornar el archivo
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    if (file instanceof File) return file;
    return new File([file], fileName, { type: file.type || 'image/jpeg' });
  }

  // Helper para procesar una fuente de imagen mediante Canvas
  const processImageBlob = (sourceBlob: Blob): Promise<File> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(sourceBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;
        const MAX_DIM = 4096;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file instanceof File ? file : new File([file], fileName, { type: 'image/jpeg' }));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png';

        const tryExport = (format: 'image/jpeg' | 'image/png', quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size <= MAX_SERVERLESS_SAFE_BYTES) {
                resolve(new File([blob], fileName, { type: blob.type }));
              } else if (format === 'image/png') {
                tryExport('image/jpeg', 0.92);
              } else {
                canvas.toBlob(
                  (finalBlob) => {
                    resolve(
                      finalBlob
                        ? new File([finalBlob], fileName, { type: finalBlob.type })
                        : (file instanceof File ? file : new File([file], fileName, { type: 'image/jpeg' }))
                    );
                  },
                  'image/jpeg',
                  0.85
                );
              }
            },
            format,
            quality
          );
        };

        tryExport(isPng ? 'image/png' : 'image/jpeg', 0.92);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file instanceof File ? file : new File([file], fileName, { type: 'image/jpeg' }));
      };

      img.src = url;
    });
  };

  // Si es un formato RAW / DNG y supera los 4.1 MB, intentar extraer el JPEG interno embebido
  if (RAW_CAMERA_REGEX.test(fileName) || !file.type || file.type === 'application/octet-stream') {
    try {
      const buffer = await file.arrayBuffer();
      const extractedJpegBlob = extractEmbeddedJpegFromRaw(buffer);
      if (extractedJpegBlob) {
        return await processImageBlob(extractedJpegBlob);
      }
    } catch (err) {
      console.warn('No se pudo extraer preview JPEG embebido del archivo RAW:', err);
    }
  }

  // Procesamiento estándar con Canvas
  return processImageBlob(file);
}
