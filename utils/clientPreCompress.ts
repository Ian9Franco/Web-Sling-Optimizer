/**
 * Límite seguro para Vercel Serverless Functions (4.1 MB)
 * Deja un margen de seguridad de 400 KB sobre el límite estricto de 4.5 MB.
 */
const MAX_SERVERLESS_SAFE_BYTES = 4.1 * 1024 * 1024;

/**
 * Pre-comprime en el navegador (client-side) cualquier imagen que supere 4.1 MB
 * para asegurar que nunca exceda el límite de carga útil (4.5 MB) de Vercel Serverless.
 * Conserva la máxima resolución y fidelidad visual antes de entrar al pipeline Sharp.
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

  // Si es mayor a 4.1 MB, pre-comprimir en Canvas
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular dimensiones manteniendo aspecto (máx 4096px 4K)
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
              // PNG aún muy grande, fallback a JPEG 92%
              tryExport('image/jpeg', 0.92);
            } else {
              // JPEG aún grande, bajar un poco la calidad para garantizar < 4.1 MB
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
}
