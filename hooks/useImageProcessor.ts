'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { 
  ProcessedImage, 
  CropFit, 
  CropPosition, 
  ContainBackground,
  ReprocessOverrides,
  ImageMetadataDetails
} from '../types/image';
import { AISettings, AIInteractionState } from '../types/ai';
import { asyncPool } from '../utils/concurrency';
import { resolveFileNamePattern, generateAltText, slugify } from '../utils/naming';
import { clientPreCompress } from '../utils/clientPreCompress';
import { isSupportedImageFile, RAW_CAMERA_REGEX } from '../utils/supportedFormats';
import { extractImageMetadata } from '../utils/metadataExtractor';
import { useRef } from 'react';

interface UseImageProcessorOptions {
  qualityMode: 'preserve' | 'manual' | 'maxKB';
  quality: number;
  maxKB: number;
  resizeMode: 'none' | 'custom';
  customWidth: string;
  customHeight: string;
  format: string;
  rotate: number;
  flip: boolean;
  grayscale: boolean;
  stripExif: boolean;
  watermarkText: string;
  customNamePattern: string;
  cropFit: CropFit;
  cropPosition: CropPosition;
  containBackground?: ContainBackground;
  upscaleFactor?: 1 | 2 | 4;
  clarity?: boolean;
}

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
};

const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function useImageProcessor(options: UseImageProcessorOptions) {
  const {
    qualityMode,
    quality,
    maxKB,
    resizeMode,
    customWidth,
    customHeight,
    format,
    rotate,
    flip,
    grayscale,
    stripExif,
    watermarkText,
    customNamePattern,
    cropFit,
    cropPosition,
    containBackground = 'blur',
    upscaleFactor = 1,
    clarity = false,
  } = options;

  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<ProcessedImage | null>(null);
  const [selectedSrcsetImage, setSelectedSrcsetImage] = useState<ProcessedImage | null>(null);
  const [selectedCropImage, setSelectedCropImage] = useState<ProcessedImage | null>(null);
  const [selectedMetadataImage, setSelectedMetadataImage] = useState<ProcessedImage | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiInteraction, setAiInteraction] = useState<AIInteractionState | null>(null);
  const originalFilesRef = useRef<Map<string, File>>(new Map());

  const inspectMetadata = async (img: ProcessedImage): Promise<ImageMetadataDetails | null> => {
    setSelectedMetadataImage(img);
    if (img.metadataDetails) {
      return img.metadataDetails;
    }

    setIsLoadingMetadata(true);
    try {
      const originalFile = originalFilesRef.current.get(img.id);
      let details: ImageMetadataDetails;

      if (originalFile) {
        details = await extractImageMetadata(originalFile, originalFile.name, originalFile.size);
      } else if (img.base64Data) {
        const res = await fetch(img.base64Data);
        const blob = await res.blob();
        details = await extractImageMetadata(blob, img.originalName, img.originalSizeBytes);
      } else {
        const res = await fetch(img.previewUrl);
        const blob = await res.blob();
        details = await extractImageMetadata(blob, img.originalName, img.originalSizeBytes);
      }

      setImages(prev => prev.map(item => item.id === img.id ? { ...item, metadataDetails: details } : item));
      setSelectedMetadataImage(prev => prev && prev.id === img.id ? { ...prev, metadataDetails: details } : prev);
      return details;
    } catch (err) {
      console.error('Error inspeccionando metadatos:', err);
      return null;
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleFiles = async (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList).filter(file => isSupportedImageFile(file));

    if (validFiles.length === 0) return;

    const newEntries: ProcessedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      originalName: file.name,
      outputFileName: file.name,
      altText: generateAltText(file.name),
      originalWidth: 0,
      originalHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      originalSizeBytes: file.size,
      compressedSizeBytes: 0,
      qualityApplied: 0,
      formatApplied: '',
      savedPercentage: 0,
      base64Data: '',
      mimeType: '',
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    validFiles.forEach((file, i) => {
      originalFilesRef.current.set(newEntries[i].id, file);
      // Extraer metadatos de forma no bloqueante en background
      extractImageMetadata(file, file.name, file.size)
        .then((meta) => {
          setImages(prev => prev.map(img => img.id === newEntries[i].id ? { ...img, metadataDetails: meta } : img));
        })
        .catch((e) => console.warn('Error en extracción de metadatos:', e));
    });

    setImages(prev => [...newEntries, ...prev]);

    // Procesamiento con concurrencia controlada (3 tareas simultáneas)
    await asyncPool(3, validFiles, async (file, i) => {
      const entryId = newEntries[i].id;
      const previewUrl = newEntries[i].previewUrl;

      setImages(prev => prev.map(img => img.id === entryId ? { ...img, status: 'processing' } : img));

      // Extraer siempre dimensiones reales de la imagen original en el cliente
      const { width: origWidth, height: origHeight } = await getImageDimensions(previewUrl);

      const isRawCamera = RAW_CAMERA_REGEX.test(file.name);

      // Si el usuario eligió Sin Pérdida y ningún filtro/recorte/conversión/upscaling/RAW, conservar el archivo 100% original sin tocar
      const isCustomTransform = 
        qualityMode !== 'preserve' ||
        resizeMode !== 'none' ||
        format !== 'original' ||
        rotate !== 0 ||
        flip ||
        grayscale ||
        isRawCamera ||
        (upscaleFactor > 1) ||
        clarity ||
        Boolean(watermarkText && watermarkText.trim().length > 0);

      if (!isCustomTransform) {
        try {
          const base64Data = await fileToBase64(file);
          const extMatch = file.name.split('.').pop()?.toUpperCase() || 'ORIGINAL';

          setImages(prev => prev.map(img => img.id === entryId ? {
            ...img,
            status: 'done',
            originalWidth: origWidth,
            originalHeight: origHeight,
            finalWidth: origWidth,
            finalHeight: origHeight,
            compressedSizeBytes: file.size,
            qualityApplied: 100,
            formatApplied: extMatch,
            savedPercentage: 0,
            base64Data,
            mimeType: file.type,
          } : img));
          return;
        } catch (e) {
          console.error('Error cargando imagen original directa:', e);
        }
      }

      try {
        const uploadableFile = await clientPreCompress(file);
        const formData = new FormData();
        formData.append('file', uploadableFile);
        if (qualityMode === 'preserve') {
          formData.append('preserveQuality', 'true');
        } else if (qualityMode === 'manual') {
          formData.append('preserveQuality', 'false');
          formData.append('quality', quality.toString());
        } else {
          formData.append('preserveQuality', 'false');
          formData.append('maxKB', maxKB.toString());
        }
        formData.append('resizeMode', resizeMode);
        formData.append('maxWidth', customWidth || '0');
        formData.append('maxHeight', customHeight || '0');
        formData.append('format', format);
        formData.append('rotate', rotate.toString());
        formData.append('flip', flip ? 'true' : 'false');
        formData.append('grayscale', grayscale ? 'true' : 'false');
        formData.append('stripExif', stripExif ? 'true' : 'false');
        formData.append('watermarkText', watermarkText);
        formData.append('customName', customNamePattern);
        formData.append('index', (i + 1).toString());
        formData.append('cropFit', cropFit);
        formData.append('cropPosition', cropPosition);
        formData.append('containBackground', containBackground);
        formData.append('upscaleFactor', upscaleFactor.toString());
        formData.append('clarity', clarity ? 'true' : 'false');

        const res = await fetch('/api/compress', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Error al comprimir.');
        }

        setImages(prev => prev.map(img => img.id === entryId ? {
          ...img,
          status: 'done',
          outputFileName: data.outputFileName,
          originalWidth: origWidth || data.originalWidth,
          originalHeight: origHeight || data.originalHeight,
          finalWidth: data.finalWidth || data.originalWidth || origWidth,
          finalHeight: data.finalHeight || data.originalHeight || origHeight,
          compressedSizeBytes: data.compressedSizeBytes,
          qualityApplied: data.qualityApplied,
          formatApplied: data.formatApplied,
          savedPercentage: data.savedPercentage,
          base64Data: data.base64Data,
          mimeType: data.mimeType,
          upscaleApplied: data.upscaleApplied,
          clarityApplied: data.clarityApplied,
        } : img));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error en proceso';
        setImages(prev => prev.map(img => img.id === entryId ? {
          ...img,
          status: 'error',
          errorMessage: errorMsg
        } : img));
      }
    });
  };

  const reprocessBatch = async (overrides?: ReprocessOverrides) => {
    const targetModeQ = overrides?.quality !== undefined 
      ? 'manual' 
      : overrides?.preserveQuality !== undefined 
        ? (overrides.preserveQuality ? 'preserve' : 'maxKB') 
        : qualityMode;
    const targetQuality = overrides?.quality ?? quality;
    const targetKB = overrides?.maxKB ?? maxKB;
    const targetMode = overrides?.resizeMode ?? resizeMode;
    const targetWidth = overrides?.customWidth ?? customWidth;
    const targetHeight = overrides?.customHeight ?? customHeight;
    const targetFormat = overrides?.format ?? format;
    const targetFit = overrides?.cropFit ?? cropFit;
    const targetPosition = overrides?.cropPosition ?? cropPosition;
    const targetContainBg = overrides?.containBackground ?? containBackground;
    const targetUpscale = overrides?.upscaleFactor ?? upscaleFactor;
    const targetClarity = overrides?.clarity ?? clarity;

    const list = [...images];
    if (list.length === 0) return;

    await asyncPool(3, list, async (img, idx) => {
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));

      const isRawCamera = RAW_CAMERA_REGEX.test(img.originalName);

      const isCustomTransform = 
        targetModeQ !== 'preserve' ||
        targetMode !== 'none' ||
        targetFormat !== 'original' ||
        rotate !== 0 ||
        flip ||
        grayscale ||
        isRawCamera ||
        (targetUpscale > 1) ||
        targetClarity ||
        Boolean(watermarkText && watermarkText.trim().length > 0);

      if (!isCustomTransform) {
        try {
          const blob = await fetch(img.previewUrl).then(r => r.blob());
          const { width, height } = await getImageDimensions(img.previewUrl);
          const base64Data = await fileToBase64(blob);
          const extMatch = img.originalName.split('.').pop()?.toUpperCase() || 'ORIGINAL';

          setImages(prev => prev.map(i => i.id === img.id ? {
            ...i,
            status: 'done',
            finalWidth: width || i.originalWidth,
            finalHeight: height || i.originalHeight,
            compressedSizeBytes: i.originalSizeBytes,
            qualityApplied: 100,
            formatApplied: extMatch,
            savedPercentage: 0,
            base64Data: base64Data || i.base64Data,
          } : i));
          return;
        } catch (e) {
          console.error('Error restaurando original:', e);
        }
      }

      try {
        const blob = await fetch(img.previewUrl).then(r => r.blob());
        const rawFile = new File([blob], img.originalName, { type: img.mimeType || 'image/jpeg' });
        const uploadableFile = await clientPreCompress(rawFile);
        
        const formData = new FormData();
        formData.append('file', uploadableFile);
        if (targetModeQ === 'preserve') {
          formData.append('preserveQuality', 'true');
        } else if (targetModeQ === 'manual') {
          formData.append('preserveQuality', 'false');
          formData.append('quality', targetQuality.toString());
        } else {
          formData.append('preserveQuality', 'false');
          formData.append('maxKB', targetKB.toString());
        }
        formData.append('resizeMode', targetMode);
        formData.append('maxWidth', targetWidth || '0');
        formData.append('maxHeight', targetHeight || '0');
        formData.append('format', targetFormat);
        formData.append('rotate', rotate.toString());
        formData.append('flip', flip ? 'true' : 'false');
        formData.append('grayscale', grayscale ? 'true' : 'false');
        formData.append('stripExif', stripExif ? 'true' : 'false');
        formData.append('watermarkText', watermarkText);
        formData.append('customName', customNamePattern);
        formData.append('index', (idx + 1).toString());
        formData.append('cropFit', targetFit);
        formData.append('cropPosition', targetPosition);
        formData.append('containBackground', targetContainBg);
        formData.append('upscaleFactor', targetUpscale.toString());
        formData.append('clarity', targetClarity ? 'true' : 'false');

        const res = await fetch('/api/compress', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Error al procesar');

        setImages(prev => prev.map(i => {
          if (i.id !== img.id) return i;

          // Si el usuario especificó un patrón global, aplicar data.outputFileName.
          // Si no, conservar el nombre actual (IA o manual) actualizando solo la extensión si cambió el formato.
          let finalOutputName = i.outputFileName;
          if (customNamePattern && customNamePattern.trim().length > 0) {
            finalOutputName = data.outputFileName || i.outputFileName;
          } else if (data.formatApplied) {
            const dotIdx = i.outputFileName.lastIndexOf('.');
            const baseSlug = dotIdx !== -1 ? i.outputFileName.substring(0, dotIdx) : i.outputFileName;
            const newExt = '.' + data.formatApplied.toLowerCase().replace('jpeg', 'jpg');
            finalOutputName = `${baseSlug}${newExt}`;
          }

          return {
            ...i,
            status: 'done',
            outputFileName: finalOutputName,
            altText: i.altText, // Conservar siempre el texto ALT generado o editado
            finalWidth: data.finalWidth || i.finalWidth,
            finalHeight: data.finalHeight || i.finalHeight,
            compressedSizeBytes: data.compressedSizeBytes,
            qualityApplied: data.qualityApplied,
            formatApplied: data.formatApplied,
            savedPercentage: data.savedPercentage,
            base64Data: data.base64Data,
            upscaleApplied: data.upscaleApplied,
            clarityApplied: data.clarityApplied,
          };
        }));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Error en proceso';
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', errorMessage: errorMsg } : i));
      }
    });
  };

  const removeSingleImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const updateOutputFileName = (id: string, newName: string) => {
    setImages(prev => prev.map(item => item.id === id ? { ...item, outputFileName: newName } : item));
  };

  const updateAltText = (id: string, newAlt: string) => {
    setImages(prev => prev.map(item => item.id === id ? { ...item, altText: newAlt } : item));
  };

  const applyBatchRename = (pattern: string) => {
    if (!pattern.trim()) return;
    setImages(prev => prev.map((img, i) => {
      const newName = resolveFileNamePattern(pattern, img, i);
      return {
        ...img,
        outputFileName: newName,
        altText: img.altText || generateAltText(newName)
      };
    }));
  };

  const applyBatchSlugify = () => {
    setImages(prev => prev.map((img) => {
      const dotIdx = img.originalName.lastIndexOf('.');
      const base = dotIdx !== -1 ? img.originalName.substring(0, dotIdx) : img.originalName;
      const ext = img.outputFileName.lastIndexOf('.') !== -1 
        ? img.outputFileName.substring(img.outputFileName.lastIndexOf('.'))
        : (dotIdx !== -1 ? img.originalName.substring(dotIdx) : '.jpg');
      const cleanSlug = slugify(base) || base;
      const newName = `${cleanSlug}${ext}`;
      return {
        ...img,
        outputFileName: newName,
        altText: generateAltText(cleanSlug)
      };
    }));
  };

  const downloadSingle = (img: ProcessedImage) => {
    try {
      if (img.base64Data && img.base64Data.startsWith('data:')) {
        const parts = img.base64Data.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = img.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      } else {
        const a = document.createElement('a');
        a.href = img.base64Data;
        a.download = img.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      const a = document.createElement('a');
      a.href = img.base64Data;
      a.download = img.outputFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const downloadAllZip = async () => {
    const doneImages = images.filter(img => img.status === 'done' && img.base64Data);
    if (doneImages.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      doneImages.forEach(img => {
        const base64Content = img.base64Data.split(',')[1];
        zip.file(img.outputFileName, base64Content, { base64: true });
      });

      const metadataManifest = doneImages.map(img => ({
        original: img.originalName,
        file: img.outputFileName,
        alt: img.altText || '',
        width: img.finalWidth,
        height: img.finalHeight,
        format: img.formatApplied,
        sizeBytes: img.compressedSizeBytes,
      }));
      zip.file('metadata.json', JSON.stringify(metadataManifest, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `websling_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error empaquetando zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleApplyCrop = async (targetImg: ProcessedImage) => {
    setSelectedCropImage(null);
    setImages(prev => prev.map(img => img.id === targetImg.id ? { ...img, status: 'processing' } : img));
    
    try {
      const blob = await fetch(targetImg.previewUrl).then(r => r.blob());
      const rawFile = new File([blob], targetImg.originalName, { type: targetImg.mimeType || 'image/jpeg' });
      const uploadableFile = await clientPreCompress(rawFile);
      
      const formData = new FormData();
      formData.append('file', uploadableFile);
      formData.append('maxKB', maxKB.toString());
      formData.append('resizeMode', 'custom');
      formData.append('maxWidth', customWidth || '1200');
      formData.append('maxHeight', customHeight || '628');
      formData.append('format', format);
      formData.append('rotate', rotate.toString());
      formData.append('flip', flip ? 'true' : 'false');
      formData.append('grayscale', grayscale ? 'true' : 'false');
      formData.append('stripExif', stripExif ? 'true' : 'false');
      formData.append('watermarkText', watermarkText);
      formData.append('cropFit', cropFit);
      formData.append('cropPosition', cropPosition);
      formData.append('containBackground', containBackground);
      formData.append('upscaleFactor', upscaleFactor.toString());
      formData.append('clarity', clarity ? 'true' : 'false');

      const res = await fetch('/api/compress', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      // Preservar nombre SEO existente actualizando extensión si aplica
      let finalCropName = targetImg.outputFileName;
      if (data.formatApplied) {
        const dotIdx = targetImg.outputFileName.lastIndexOf('.');
        const baseSlug = dotIdx !== -1 ? targetImg.outputFileName.substring(0, dotIdx) : targetImg.outputFileName;
        const newExt = '.' + data.formatApplied.toLowerCase().replace('jpeg', 'jpg');
        finalCropName = `${baseSlug}${newExt}`;
      }

      setImages(prev => prev.map(img => img.id === targetImg.id ? {
        ...img,
        status: 'done',
        outputFileName: finalCropName,
        altText: targetImg.altText,
        finalWidth: data.finalWidth,
        finalHeight: data.finalHeight,
        compressedSizeBytes: data.compressedSizeBytes,
        qualityApplied: data.qualityApplied,
        formatApplied: data.formatApplied,
        savedPercentage: data.savedPercentage,
        base64Data: data.base64Data,
        upscaleApplied: data.upscaleApplied,
        clarityApplied: data.clarityApplied,
      } : img));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error recortando imagen:', errorMsg);
      setImages(prev => prev.map(img => img.id === targetImg.id ? { ...img, status: 'error', errorMessage: errorMsg } : img));
    }
  };

  const handleReprocessSingle = async (targetImg: ProcessedImage, customQuality: number): Promise<ProcessedImage | null> => {
    try {
      const blob = await fetch(targetImg.previewUrl).then(r => r.blob());
      const rawFile = new File([blob], targetImg.originalName, { type: targetImg.mimeType || 'image/jpeg' });
      const uploadableFile = await clientPreCompress(rawFile);
      
      const formData = new FormData();
      formData.append('file', uploadableFile);
      formData.append('preserveQuality', 'false');
      formData.append('quality', customQuality.toString());
      formData.append('format', format);
      formData.append('rotate', rotate.toString());
      formData.append('flip', flip ? 'true' : 'false');
      formData.append('grayscale', grayscale ? 'true' : 'false');
      formData.append('stripExif', stripExif ? 'true' : 'false');
      formData.append('watermarkText', watermarkText);
      formData.append('cropFit', cropFit);
      formData.append('cropPosition', cropPosition);
      formData.append('containBackground', containBackground);
      formData.append('upscaleFactor', upscaleFactor.toString());
      formData.append('clarity', clarity ? 'true' : 'false');

      const res = await fetch('/api/compress', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      let finalReprocessName = targetImg.outputFileName;
      if (data.formatApplied) {
        const dotIdx = targetImg.outputFileName.lastIndexOf('.');
        const baseSlug = dotIdx !== -1 ? targetImg.outputFileName.substring(0, dotIdx) : targetImg.outputFileName;
        const newExt = '.' + data.formatApplied.toLowerCase().replace('jpeg', 'jpg');
        finalReprocessName = `${baseSlug}${newExt}`;
      }

      const updatedImg: ProcessedImage = {
        ...targetImg,
        status: 'done',
        outputFileName: finalReprocessName,
        altText: targetImg.altText,
        finalWidth: data.finalWidth,
        finalHeight: data.finalHeight,
        compressedSizeBytes: data.compressedSizeBytes,
        qualityApplied: data.qualityApplied,
        formatApplied: data.formatApplied,
        savedPercentage: data.savedPercentage,
        base64Data: data.base64Data,
        upscaleApplied: data.upscaleApplied,
        clarityApplied: data.clarityApplied,
      };

      setImages(prev => prev.map(img => img.id === targetImg.id ? updatedImg : img));
      return updatedImg;
    } catch (err: unknown) {
      console.error('Error re-procesando imagen individual:', err);
      return null;
    }
  };

  const totalOriginalBytes = images.filter(i => i.status === 'done').reduce((acc, curr) => acc + curr.originalSizeBytes, 0);
  const totalCompressedBytes = images.filter(i => i.status === 'done').reduce((acc, curr) => acc + curr.compressedSizeBytes, 0);
  const totalSavedBytes = totalOriginalBytes > 0 && totalCompressedBytes > 0 ? totalOriginalBytes - totalCompressedBytes : 0;
  const overallSavedPercent = totalOriginalBytes > 0 ? ((totalSavedBytes / totalOriginalBytes) * 100).toFixed(0) : '0';

  const closeAiInteraction = () => {
    setAiInteraction(null);
  };

  const analyzeSingleAI = async (img: ProcessedImage, aiSettings: AISettings, onNeedConfig?: () => void) => {
    const activeKey = aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey;
    const modelUsed = aiSettings.provider === 'gemini' ? aiSettings.geminiModel : aiSettings.openaiModel;

    if (!activeKey || activeKey.trim().length < 5) {
      if (onNeedConfig) onNeedConfig();
      return;
    }

    setAnalyzingId(img.id);
    setAiInteraction({
      isActive: true,
      provider: aiSettings.provider,
      model: modelUsed,
      currentImageName: img.originalName,
      currentImagePreview: img.base64Data || img.previewUrl,
      step: 'requesting',
      stepMessage: `Enviando imagen y prompt al modelo ${modelUsed}...`,
      currentIndex: 1,
      totalImages: 1,
    });

    try {
      const formData = new FormData();
      if (img.base64Data) {
        formData.append('base64Data', img.base64Data);
      } else {
        const blob = await fetch(img.previewUrl).then(r => r.blob());
        const file = new File([blob], img.originalName, { type: img.mimeType || 'image/jpeg' });
        formData.append('file', file);
      }

      formData.append('provider', aiSettings.provider);
      formData.append('apiKey', activeKey);
      formData.append('model', modelUsed);
      formData.append('customContext', aiSettings.customContext);
      formData.append('language', aiSettings.language);
      formData.append('originalName', img.outputFileName || img.originalName);

      setAiInteraction(prev => prev ? {
        ...prev,
        step: 'analyzing',
        stepMessage: 'Visión multimodal analizando contenido, sujeto y contexto SEO...',
      } : null);

      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al analizar la imagen con IA');
      }

      setImages(prev => prev.map(item => item.id === img.id ? {
        ...item,
        outputFileName: data.fileName || item.outputFileName,
        altText: data.altText || item.altText,
      } : item));

      setAiInteraction(prev => prev ? {
        ...prev,
        step: 'done',
        stepMessage: '¡Nombre SEO y texto ALT generados con éxito!',
        generatedFileName: data.fileName,
        generatedAltText: data.altText,
      } : null);

      // Auto-cierre del popup tras terminar
      setTimeout(() => {
        setAiInteraction(prev => prev ? { ...prev, isActive: false } : null);
      }, 2200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con la IA';
      setAiInteraction(prev => prev ? {
        ...prev,
        step: 'error',
        stepMessage: msg,
        error: msg,
      } : null);
      setTimeout(() => {
        setAiInteraction(prev => prev ? { ...prev, isActive: false } : null);
      }, 4000);
    } finally {
      setAnalyzingId(null);
    }
  };

  const analyzeBatchAI = async (aiSettings: AISettings, onNeedConfig?: () => void) => {
    const activeKey = aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey;
    const modelUsed = aiSettings.provider === 'gemini' ? aiSettings.geminiModel : aiSettings.openaiModel;

    if (!activeKey || activeKey.trim().length < 5) {
      if (onNeedConfig) onNeedConfig();
      return;
    }

    if (images.length === 0) return;

    setIsAnalyzingAI(true);
    setAiInteraction({
      isActive: true,
      provider: aiSettings.provider,
      model: modelUsed,
      currentImageName: images[0]?.originalName || 'Lote',
      currentImagePreview: images[0]?.base64Data || images[0]?.previewUrl,
      step: 'init',
      stepMessage: `Iniciando análisis multimodal de ${images.length} imágenes...`,
      currentIndex: 1,
      totalImages: images.length,
    });

    try {
      let processedCount = 0;
      await asyncPool(2, images, async (img, idx) => {
        setAnalyzingId(img.id);
        setAiInteraction(prev => prev ? {
          ...prev,
          currentImageName: img.originalName,
          currentImagePreview: img.base64Data || img.previewUrl,
          currentIndex: idx + 1,
          step: 'analyzing',
          stepMessage: `Analizando ${idx + 1} de ${images.length}: ${img.originalName}...`,
        } : null);

        try {
          const formData = new FormData();
          if (img.base64Data) {
            formData.append('base64Data', img.base64Data);
          } else {
            const blob = await fetch(img.previewUrl).then(r => r.blob());
            const file = new File([blob], img.originalName, { type: img.mimeType || 'image/jpeg' });
            formData.append('file', file);
          }

          formData.append('provider', aiSettings.provider);
          formData.append('apiKey', activeKey);
          formData.append('model', modelUsed);
          formData.append('customContext', aiSettings.customContext);
          formData.append('language', aiSettings.language);
          formData.append('originalName', img.outputFileName || img.originalName);

          const res = await fetch('/api/ai/describe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.success) {
            processedCount++;
            setImages(prev => prev.map(item => item.id === img.id ? {
              ...item,
              outputFileName: data.fileName || item.outputFileName,
              altText: data.altText || item.altText,
            } : item));

            setAiInteraction(prev => prev ? {
              ...prev,
              generatedFileName: data.fileName,
              generatedAltText: data.altText,
              stepMessage: `Completado (${processedCount}/${images.length}): ${data.fileName}`,
            } : null);
          }
        } catch (err) {
          console.error(`Error analizando ${img.originalName} con IA:`, err);
        }
      });

      setAiInteraction(prev => prev ? {
        ...prev,
        step: 'done',
        stepMessage: `¡Lote de ${images.length} imágenes analizado con éxito!`,
      } : null);

      setTimeout(() => {
        setAiInteraction(prev => prev ? { ...prev, isActive: false } : null);
      }, 2500);
    } finally {
      setAnalyzingId(null);
      setIsAnalyzingAI(false);
    }
  };

  return {
    images,
    setImages,
    isZipping,
    selectedPreview,
    setSelectedPreview,
    selectedSrcsetImage,
    setSelectedSrcsetImage,
    selectedCropImage,
    setSelectedCropImage,
    selectedMetadataImage,
    setSelectedMetadataImage,
    isLoadingMetadata,
    inspectMetadata,
    analyzingId,
    isAnalyzingAI,
    aiInteraction,
    closeAiInteraction,
    analyzeSingleAI,
    analyzeBatchAI,
    handleFiles,
    reprocessBatch,
    handleApplyCrop,
    handleReprocessSingle,
    removeSingleImage,
    updateOutputFileName,
    updateAltText,
    applyBatchRename,
    applyBatchSlugify,
    downloadSingle,
    downloadAllZip,
    totalOriginalBytes,
    totalCompressedBytes,
    totalSavedBytes,
    overallSavedPercent,
  };
}
