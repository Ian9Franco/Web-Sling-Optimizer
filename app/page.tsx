'use client';

import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Upload, 
  Download, 
  Trash2, 
  Sliders, 
  Maximize2, 
  ArrowRight, 
  Eye, 
  X, 
  Check, 
  LayoutGrid,
  List,
  Crop,
  Globe,
  Github,
  Instagram,
  RotateCw,
  FlipHorizontal,
  ShieldCheck,
  Type,
  Sparkles,
  Package,
  Copy,
  Zap,
  Image as ImageIcon
} from 'lucide-react';

interface ProcessedImage {
  id: string;
  originalName: string;
  outputFileName: string;
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  qualityApplied: number;
  formatApplied: string;
  savedPercentage: number;
  base64Data: string;
  mimeType: string;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export default function HomePage() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [maxKB, setMaxKB] = useState<number>(200);
  const [format, setFormat] = useState<string>('original');
  const [resizeMode, setResizeMode] = useState<'none' | 'custom'>('none');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<ProcessedImage | null>(null);

  // Nuevas opciones avanzadas
  const [rotate, setRotate] = useState<number>(0);
  const [flip, setFlip] = useState<boolean>(false);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [stripExif, setStripExif] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [customNamePattern, setCustomNamePattern] = useState<string>('');

  // Opciones de Recorte y Aspect Ratio (Google Ads / Redes)
  const [cropFit, setCropFit] = useState<'inside' | 'cover'>('inside');
  const [cropPosition, setCropPosition] = useState<'center' | 'top' | 'bottom' | 'entropy' | 'attention'>('center');
  const [selectedCropImage, setSelectedCropImage] = useState<ProcessedImage | null>(null);

  // Favicon Modal State
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconCustomName, setFaviconCustomName] = useState<string>('favicon');
  const [faviconResults, setFaviconResults] = useState<any | null>(null);
  const [isGeneratingFavicons, setIsGeneratingFavicons] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Helper para escanear directorios y carpetas recursivamente
  const scanEntry = async (entry: any): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => resolve([file]), () => resolve([]));
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readEntries = async (): Promise<any[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries((entries: any[]) => resolve(entries), () => resolve([]));
        });
      };
      let entries = await readEntries();
      while (entries.length > 0) {
        for (const childEntry of entries) {
          const childFiles = await scanEntry(childEntry);
          files.push(...childFiles);
        }
        entries = await readEntries();
      }
    }
    return files;
  };

  // Procesador inteligente de carpetas, zips y archivos sueltos
  const processDataTransfer = async (dataTransfer: DataTransfer) => {
    const extractedFiles: File[] = [];
    const items = Array.from(dataTransfer.items || []);
    const entries: any[] = [];

    for (const item of items) {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) entries.push(entry);
      }
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        const filesFromEntry = await scanEntry(entry);
        extractedFiles.push(...filesFromEntry);
      }
    } else if (dataTransfer.files) {
      extractedFiles.push(...Array.from(dataTransfer.files));
    }

    const finalImageFiles: File[] = [];

    for (const file of extractedFiles) {
      if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFilePromises: Promise<File | null>[] = [];

          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && /\.(jpg|jpeg|png|webp|avif|tiff|bmp)$/i.test(zipEntry.name)) {
              zipFilePromises.push(
                zipEntry.async('blob').then(blob => {
                  const fileName = relativePath.split('/').pop() || zipEntry.name;
                  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                })
              );
            }
          });

          const unpackedFiles = await Promise.all(zipFilePromises);
          unpackedFiles.forEach(f => { if (f) finalImageFiles.push(f); });
        } catch (err) {
          console.error('Error al descomprimir archivo ZIP:', err);
        }
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|tiff|bmp)$/i.test(file.name)) {
        finalImageFiles.push(file);
      }
    }

    if (finalImageFiles.length > 0) {
      await handleFiles(finalImageFiles);
    }
  };

  // Drag & Drop Global en toda la ventana
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer) {
        await processDataTransfer(e.dataTransfer);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [maxKB, format, resizeMode, customWidth, customHeight, rotate, flip, grayscale, stripExif, watermarkText, customNamePattern]);

  const handleFiles = async (filesList: FileList | File[]) => {
    const validFiles = Array.from(filesList).filter(file => 
      file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|tiff|bmp)$/i.test(file.name)
    );

    if (validFiles.length === 0) return;

    const newEntries: ProcessedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      originalName: file.name,
      outputFileName: file.name,
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

    setImages(prev => [...newEntries, ...prev]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const entryId = newEntries[i].id;

      setImages(prev => prev.map(img => img.id === entryId ? { ...img, status: 'processing' } : img));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('maxKB', maxKB.toString());
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
        formData.append('cropFit', cropFit);
        formData.append('cropPosition', cropPosition);

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
          originalWidth: data.originalWidth,
          originalHeight: data.originalHeight,
          finalWidth: data.finalWidth || data.originalWidth,
          finalHeight: data.finalHeight || data.originalHeight,
          compressedSizeBytes: data.compressedSizeBytes,
          qualityApplied: data.qualityApplied,
          formatApplied: data.formatApplied,
          savedPercentage: data.savedPercentage,
          base64Data: data.base64Data,
          mimeType: data.mimeType,
        } : img));
      } catch (err: any) {
        setImages(prev => prev.map(img => img.id === entryId ? {
          ...img,
          status: 'error',
          errorMessage: err.message || 'Error en proceso'
        } : img));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeSingleImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Re-procesar todas las imágenes cargadas con los parámetros vigentes o nuevos
  const reprocessBatch = async (overrides?: {
    maxKB?: number;
    resizeMode?: 'none' | 'custom';
    customWidth?: string;
    customHeight?: string;
    format?: string;
    cropFit?: 'inside' | 'cover';
    cropPosition?: 'center' | 'top' | 'bottom' | 'entropy' | 'attention';
  }) => {
    const targetKB = overrides?.maxKB ?? maxKB;
    const targetMode = overrides?.resizeMode ?? resizeMode;
    const targetWidth = overrides?.customWidth ?? customWidth;
    const targetHeight = overrides?.customHeight ?? customHeight;
    const targetFormat = overrides?.format ?? format;
    const targetFit = overrides?.cropFit ?? cropFit;
    const targetPosition = overrides?.cropPosition ?? cropPosition;

    const list = [...images];
    if (list.length === 0) return;

    for (const img of list) {
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
      try {
        const blob = await fetch(img.previewUrl).then(r => r.blob());
        const file = new File([blob], img.originalName, { type: img.mimeType || 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('maxKB', targetKB.toString());
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
        formData.append('cropFit', targetFit);
        formData.append('cropPosition', targetPosition);

        const res = await fetch('/api/compress', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Error al procesar');

        setImages(prev => prev.map(i => i.id === img.id ? {
          ...i,
          status: 'done',
          outputFileName: data.outputFileName,
          finalWidth: data.finalWidth,
          finalHeight: data.finalHeight,
          compressedSizeBytes: data.compressedSizeBytes,
          qualityApplied: data.qualityApplied,
          formatApplied: data.formatApplied,
          savedPercentage: data.savedPercentage,
          base64Data: data.base64Data,
        } : i));
      } catch (err: any) {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', errorMessage: err.message } : i));
      }
    }
  };

  const downloadSingle = (img: ProcessedImage) => {
    const a = document.createElement('a');
    a.href = img.base64Data;
    a.download = img.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  // Generador de Favicon Paquete
  const handleFaviconProcess = async (file: File) => {
    setFaviconFile(file);
    setIsGeneratingFavicons(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customName', faviconCustomName || 'favicon');
      const res = await fetch('/api/favicon', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al generar favicons');
      setFaviconResults(data);
    } catch (err: any) {
      alert(err.message || 'Error procesando favicons');
    } finally {
      setIsGeneratingFavicons(false);
    }
  };

  const downloadFaviconZip = async () => {
    if (!faviconResults) return;
    try {
      const zip = new JSZip();
      faviconResults.icons.forEach((icon: any) => {
        zip.file(icon.name, icon.base64, { base64: true });
      });
      zip.file('site.webmanifest', faviconResults.manifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favicons_pack_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generando zip de favicons:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalOriginalBytes = images.filter(i => i.status === 'done').reduce((acc, curr) => acc + curr.originalSizeBytes, 0);
  const totalCompressedBytes = images.filter(i => i.status === 'done').reduce((acc, curr) => acc + curr.compressedSizeBytes, 0);
  const totalSavedBytes = totalOriginalBytes > 0 && totalCompressedBytes > 0 ? totalOriginalBytes - totalCompressedBytes : 0;
  const overallSavedPercent = totalOriginalBytes > 0 ? ((totalSavedBytes / totalOriginalBytes) * 100).toFixed(0) : '0';

  return (
    <div className="bg-tech-grid min-h-screen font-sans text-slate-200 antialiased pb-16 relative">
      {/* Overlay Drag & Drop Global */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-[#090b10]/95 backdrop-blur-md border-4 border-dashed border-[#e62429] flex flex-col items-center justify-center text-white pointer-events-none animate-pulse">
          <Upload className="w-16 h-16 text-[#e62429] mb-4 animate-bounce" />
          <h2 className="text-2xl font-mono font-bold uppercase mb-2">¡SOLTAR ARCHIVOS, CARPETAS O ZIP ACÁ!</h2>
          <p className="text-sm font-mono text-slate-400">Escanearemos y procesaremos todas las imágenes encontradas automáticamente</p>
        </div>
      )}
      {/* Navbar Superior */}
      <nav className="border-b border-[#232730] bg-[#090b10]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#232730] shadow-md shadow-[#e62429]/30 bg-[#090b10] flex items-center justify-center p-0.5">
              <img src="/apple-touch-icon.png" alt="Web-Sling Logo" className="w-full h-full object-contain rounded" />
            </div>
            <span className="font-mono text-sm tracking-wide font-bold text-white uppercase">
              Web-Sling <span className="text-[#e62429]">Optimizer</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
              v1.2 &bull; COMPRESIÓN + EDITORIAL + FAVICONS
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              type="button"
              onClick={() => setIsFaviconModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2563eb] text-white hover:bg-[#3b82f6] transition shadow-md shadow-[#2563eb]/20"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Favicon Generator</span>
            </button>

            {images.length > 0 && (
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                Ahorrado: {formatBytes(totalSavedBytes)} ({overallSavedPercent}%)
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Panel de Control (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Presets Rápidos de 1-Clic */}
            <div className="panel-border p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold uppercase">
                <Zap className="w-3.5 h-3.5 text-[#e62429]" />
                <span>Presets de 1-Clic</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => { 
                    setMaxKB(100); setResizeMode('custom'); setCustomWidth('800'); setCustomHeight('800'); setFormat('webp'); setCropFit('cover');
                    reprocessBatch({ maxKB: 100, resizeMode: 'custom', customWidth: '800', customHeight: '800', format: 'webp', cropFit: 'cover' });
                  }}
                  className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
                >
                  <span className="block font-bold text-white">E-commerce</span>
                  <span className="text-slate-400">800px &bull; 100KB</span>
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setMaxKB(200); setResizeMode('custom'); setCustomWidth('1080'); setCustomHeight('1080'); setFormat('jpg'); setCropFit('cover');
                    reprocessBatch({ maxKB: 200, resizeMode: 'custom', customWidth: '1080', customHeight: '1080', format: 'jpg', cropFit: 'cover' });
                  }}
                  className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
                >
                  <span className="block font-bold text-white">Redes Social</span>
                  <span className="text-slate-400">1080px &bull; 200KB</span>
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setMaxKB(50); setResizeMode('custom'); setCustomWidth('500'); setCustomHeight(''); setFormat('webp'); setCropFit('inside');
                    reprocessBatch({ maxKB: 50, resizeMode: 'custom', customWidth: '500', customHeight: '', format: 'webp', cropFit: 'inside' });
                  }}
                  className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
                >
                  <span className="block font-bold text-white">Emailing</span>
                  <span className="text-slate-400">500px &bull; 50KB</span>
                </button>
              </div>
            </div>

            <div className="panel-border p-5 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-[#232730]">
                <Sliders className="w-4 h-4 text-[#e62429]" />
                <h2 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
                  Parámetros de Compresión
                </h2>
              </div>

              {/* Límite de Peso */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Peso Máximo Objetivo:</span>
                  <span className="text-[#e62429] font-bold text-sm">{maxKB} KB</span>
                </div>

                <input
                  type="range"
                  min="30"
                  max="1000"
                  step="10"
                  value={maxKB}
                  onChange={(e) => setMaxKB(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer"
                />

                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[100, 200, 300, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxKB(val)}
                      className={`text-[11px] font-mono py-1.5 rounded border transition ${
                        maxKB === val
                          ? 'bg-[#e62429] border-[#e62429] text-white font-bold shadow-md shadow-[#e62429]/30'
                          : 'bg-[#14161b] border-[#232730] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {val} KB
                    </button>
                  ))}
                </div>
              </div>

              {/* Control de Dimensiones */}
              <div className="space-y-3 pt-3 border-t border-[#232730]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Dimensiones:</span>
                  <span className="text-slate-200 font-semibold">
                    {resizeMode === 'none' ? 'Originales' : 'Personalizadas'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResizeMode('none')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border font-mono text-xs transition ${
                      resizeMode === 'none'
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-md shadow-[#2563eb]/30'
                        : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Sin Alterar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResizeMode('custom')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border font-mono text-xs transition ${
                      resizeMode === 'custom'
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-md shadow-[#2563eb]/30'
                        : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Personalizar</span>
                  </button>
                </div>

                {/* Campos para dimensiones personalizadas */}
                {resizeMode === 'custom' && (
                  <div className="space-y-3 pt-2 bg-[#0c0d10] p-3 rounded-lg border border-[#232730]">
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Ancho máx (px)</label>
                        <input
                          type="number"
                          placeholder="Ej. 1920"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] rounded p-2 text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Alto máx (px)</label>
                        <input
                          type="number"
                          placeholder="Auto (opcional)"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] rounded p-2 text-white outline-none"
                        />
                      </div>
                    </div>

                    {/* Presets de dimensiones y Ads */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">Presets Rápidos & Formatos Ads:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: 'Google Ads (1200x628)', w: '1200', h: '628', fit: 'cover' },
                          { label: 'Banner (1920x1080)', w: '1920', h: '1080', fit: 'cover' },
                          { label: 'Cuadrado (1080x1080)', w: '1080', h: '1080', fit: 'cover' },
                          { label: 'Historia (1080x1920)', w: '1080', h: '1920', fit: 'cover' },
                          { label: 'Retrato (1080x1350)', w: '1080', h: '1350', fit: 'cover' },
                          { label: 'Libre HD (1280)', w: '1280', h: '', fit: 'inside' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => { 
                              setCustomWidth(preset.w); 
                              setCustomHeight(preset.h); 
                              setCropFit(preset.fit as any);
                              setResizeMode('custom');
                              reprocessBatch({ customWidth: preset.w, customHeight: preset.h, cropFit: preset.fit as any, resizeMode: 'custom' });
                            }}
                            className="text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] text-slate-300 px-2 py-1 rounded transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modo de Ajuste: Escalar vs Recortar */}
                    <div className="space-y-2 pt-2 border-t border-[#232730]">
                      <label className="text-[10px] font-mono text-slate-400 block font-bold">Modo de Recorte (Sin Estirar):</label>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => setCropFit('inside')}
                          className={`py-1.5 px-2 rounded border text-center transition ${
                            cropFit === 'inside'
                              ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                              : 'bg-[#14161b] border-[#232730] text-slate-400'
                          }`}
                        >
                          Sin Cortar (Escalar)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropFit('cover')}
                          className={`py-1.5 px-2 rounded border text-center transition ${
                            cropFit === 'cover'
                              ? 'bg-[#e62429] border-[#e62429] text-white font-bold'
                              : 'bg-[#14161b] border-[#232730] text-slate-400'
                          }`}
                        >
                          Recortar Formato Exacto
                        </button>
                      </div>
                    </div>

                    {/* Enfoque / Zona de Recorte */}
                    {cropFit === 'cover' && (
                      <div className="space-y-1.5 pt-2 border-t border-[#232730]">
                        <label className="text-[10px] font-mono text-slate-400 block font-bold">Enfoque / Zona de Recorte:</label>
                        <select
                          value={cropPosition}
                          onChange={(e) => setCropPosition(e.target.value as any)}
                          className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                        >
                          <option value="center">Centro (Default)</option>
                          <option value="top">Arriba (Priorizar Cabecera)</option>
                          <option value="bottom">Abajo (Priorizar Base)</option>
                          <option value="entropy">IA Enfoque Inteligente (Detalles)</option>
                          <option value="attention">IA Detección de Sujeto / Rostros</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Formato de Salida */}
              <div className="space-y-2 pt-3 border-t border-[#232730]">
                <label className="text-xs font-mono text-slate-400 block">Formato de Salida</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded-lg p-2.5 text-slate-200 outline-none"
                >
                  <option value="original">Original (Auto JPG si excede KB)</option>
                  <option value="webp">WebP (Optimizado Web)</option>
                  <option value="jpg">JPG (Máxima Compatibilidad)</option>
                  <option value="png">PNG (Indexado de Calidad)</option>
                </select>
              </div>

              {/* Herramientas de Edición & Seguridad */}
              <div className="space-y-3 pt-3 border-t border-[#232730]">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span className="font-bold text-slate-300">Edición & Seguridad EXIF</span>
                </div>

                {/* Rotación y Espejo */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotate(prev => (prev + 90) % 360)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border font-mono text-xs transition ${
                      rotate > 0
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                        : 'bg-[#0c0d10] border-[#232730] text-slate-400'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotar {rotate}°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlip(prev => !prev)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border font-mono text-xs transition ${
                      flip
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                        : 'bg-[#0c0d10] border-[#232730] text-slate-400'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>{flip ? 'Espejado ON' : 'Espejar'}</span>
                  </button>
                </div>

                {/* Grayscale y EXIF */}
                <div className="space-y-2 font-mono text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="rounded accent-[#e62429]"
                    />
                    <span>Convertir a Blanco y Negro</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={stripExif}
                      onChange={(e) => setStripExif(e.target.checked)}
                      className="rounded accent-[#e62429]"
                    />
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Limpiar Metadatos EXIF / GPS</span>
                    </span>
                  </label>
                </div>

                {/* Marca de Agua */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Type className="w-3 h-3 text-[#e62429]" />
                    <span>Marca de Agua en Texto (opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. © MiMarca.com"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                  />
                </div>

                {/* Nombre de Archivo Personalizado / Prefijo */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Copy className="w-3 h-3 text-[#2563eb]" />
                    <span>Renombrar Archivo en Compresión (opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. producto_optimizada"
                    value={customNamePattern}
                    onChange={(e) => setCustomNamePattern(e.target.value)}
                    className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Resumen de Lote */}
            {images.length > 0 && (
              <div className="panel-border p-5 font-mono text-xs space-y-3">
                <div className="text-slate-400 uppercase tracking-wider text-[10px] pb-2 border-b border-[#232730]">
                  Resumen de Lote
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Procesadas:</span>
                  <span className="text-white font-bold">{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peso Original:</span>
                  <span className="text-slate-300">{formatBytes(totalOriginalBytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peso Optimizado:</span>
                  <span className="text-emerald-400 font-bold">{formatBytes(totalCompressedBytes)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Dropzone y Tabla/Grid (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`panel-border p-8 text-center cursor-pointer transition-all duration-200 border-dashed ${
                isDragging 
                  ? 'border-[#e62429] bg-[#e62429]/10 scale-[1.005]' 
                  : 'border-[#232730] hover:border-[#2563eb]/60 bg-[#14161b]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.tiff,.bmp"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              <div className="w-12 h-12 rounded-xl bg-[#0c0d10] border border-[#232730] text-[#e62429] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>

              <h3 className="font-mono text-sm font-bold text-white mb-1">
                SOLTAR IMÁGENES ACÁ O PEGAR (CTRL + V)
              </h3>
              <p className="text-slate-500 text-xs font-mono">
                Soporta JPG, PNG, WebP, AVIF, TIFF, BMP &bull; Máx. 4.5 MB por archivo (Optimizado para Vercel)
              </p>
            </div>

            {/* Toolbar de la Lista */}
            {images.length > 0 && (
              <div className="flex items-center justify-between pb-2 border-b border-[#232730]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs uppercase text-slate-400 font-bold">
                    Archivos ({images.length})
                  </span>
                  <div className="flex bg-[#0c0d10] border border-[#232730] rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1 rounded text-xs ${viewMode === 'table' ? 'bg-[#2563eb] text-white' : 'text-slate-400'}`}
                      title="Vista Tabla"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded text-xs ${viewMode === 'grid' ? 'bg-[#2563eb] text-white' : 'text-slate-400'}`}
                      title="Vista Grid"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reprocessBatch()}
                    className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-2.5 py-1 rounded bg-[#14161b] border border-[#232730] hover:border-[#2563eb] transition"
                    title="Re-comprimir todo el lote con los parámetros actuales"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>Re-aplicar Ajustes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImages([])}
                    className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded bg-[#14161b] border border-[#232730] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadAllZip}
                    disabled={isZipping || !images.some(i => i.status === 'done')}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#e62429] hover:bg-[#ff3b30] text-white px-4 py-1.5 rounded transition shadow-md shadow-[#e62429]/30 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isZipping ? 'Empaquetando...' : 'DESCARGAR TODO (.ZIP)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Vista Tabla Detallada */}
            {images.length > 0 && viewMode === 'table' && (
              <div className="panel-border overflow-hidden">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0c0d10] border-b border-[#232730] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Imagen</th>
                      <th className="p-3">Nombre Original</th>
                      <th className="p-3">Dimensiones</th>
                      <th className="p-3">Peso</th>
                      <th className="p-3">Calidad</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730]">
                    {images.map((img) => (
                      <tr key={img.id} className="hover:bg-[#181d2e] transition">
                        <td className="p-3">
                          <div className="w-10 h-10 rounded bg-[#0c0d10] overflow-hidden border border-[#232730]">
                            <img 
                              src={img.base64Data || img.previewUrl} 
                              alt={img.originalName} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>

                        <td className="p-3 max-w-[200px]">
                          <input 
                            type="text" 
                            value={img.outputFileName} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setImages(prev => prev.map(item => item.id === img.id ? { ...item, outputFileName: val } : item));
                            }}
                            className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono font-semibold text-white px-2 py-1 rounded outline-none"
                            title="Editar nombre de salida de este archivo"
                          />
                        </td>

                        <td className="p-3 text-slate-400">
                          {img.status === 'done' ? (
                            <div>
                              <span className="text-slate-200">
                                {img.finalWidth} × {img.finalHeight} px
                              </span>
                              {(img.finalWidth !== img.originalWidth || img.finalHeight !== img.originalHeight) ? (
                                <span className="block text-[10px] text-amber-400">
                                  Orig: {img.originalWidth} × {img.originalHeight}
                                </span>
                              ) : (
                                <span className="block text-[10px] text-emerald-400">
                                  100% Original
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Calculando...</span>
                          )}
                        </td>

                        <td className="p-3">
                          {img.status === 'done' ? (
                            <div>
                              <span className="text-emerald-400 font-bold">{formatBytes(img.compressedSizeBytes)}</span>
                              <span className="text-slate-500 block text-[10px]">de {formatBytes(img.originalSizeBytes)} (-{img.savedPercentage}%)</span>
                              {img.originalSizeBytes > 4.5 * 1024 * 1024 && (
                                <span className="block text-[9px] text-amber-400 font-semibold">
                                  ⚠️ Original {formatBytes(img.originalSizeBytes)} (&gt; 4.5MB)
                                </span>
                              )}
                            </div>
                          ) : img.status === 'processing' ? (
                            <span className="text-[#2563eb] animate-pulse">Comprimiendo...</span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-rose-400 block font-bold">Error</span>
                              {img.originalSizeBytes > 4.5 * 1024 * 1024 && (
                                <span className="text-[9px] text-rose-400 block">
                                  Excede 4.5MB (Límite Serverless Vercel)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-slate-400">
                          {img.status === 'done' ? (
                            <span className="bg-[#0c0d10] border border-[#232730] px-2 py-0.5 rounded text-[11px]">
                              {img.qualityApplied}% ({img.formatApplied})
                            </span>
                          ) : '-'}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {img.status === 'done' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCropImage(img)}
                                  className="p-1.5 rounded bg-[#0c0d10] text-[#e62429] hover:text-white border border-[#232730]"
                                  title="Recortar / Formato Ads"
                                >
                                  <Crop className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPreview(img)}
                                  className="p-1.5 rounded bg-[#0c0d10] text-slate-400 hover:text-white border border-[#232730]"
                                  title="Ver Comparativa"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadSingle(img)}
                                  className="p-1.5 rounded bg-[#e62429] text-white font-bold hover:bg-[#ff3b30] shadow-sm shadow-[#e62429]/30"
                                  title="Descargar"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => removeSingleImage(img.id)}
                              className="p-1.5 rounded bg-[#0c0d10] text-slate-400 hover:text-rose-400 border border-[#232730] transition"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vista Grid */}
            {images.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="panel-border p-4 space-y-3 relative group">
                    <button
                      type="button"
                      onClick={() => removeSingleImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-[#090b10]/90 text-slate-400 hover:text-rose-400 border border-[#232730] transition backdrop-blur z-10"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="aspect-video bg-[#0c0d10] rounded-lg overflow-hidden border border-[#232730] relative">
                      <img src={img.base64Data || img.previewUrl} alt={img.originalName} className="w-full h-full object-cover" />
                    </div>

                    <div className="font-mono text-xs space-y-1">
                      <input 
                        type="text" 
                        value={img.outputFileName} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setImages(prev => prev.map(item => item.id === img.id ? { ...item, outputFileName: val } : item));
                        }}
                        className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono font-bold text-white px-2 py-1 rounded outline-none mb-1"
                        title="Editar nombre de salida de este archivo"
                      />
                      {img.status === 'done' && (
                        <>
                          <div className="text-slate-400 flex justify-between text-[11px]">
                            <span>Dimensiones:</span>
                            <span className="text-slate-200">{img.finalWidth} × {img.finalHeight} px</span>
                          </div>
                          <div className="text-slate-400 flex justify-between text-[11px]">
                            <span>Peso:</span>
                            <span className="text-emerald-400 font-bold">{formatBytes(img.compressedSizeBytes)} (-{img.savedPercentage}%)</span>
                          </div>
                        </>
                      )}
                    </div>

                    {img.status === 'done' && (
                      <button
                        type="button"
                        onClick={() => downloadSingle(img)}
                        className="w-full py-1.5 bg-[#e62429] text-white font-mono font-bold text-xs rounded hover:bg-[#ff3b30] transition shadow-md shadow-[#e62429]/30 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="border-t border-[#232730] py-6 mt-12 bg-[#090b10]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div>
            Desarrollado por <span className="text-slate-200 font-bold">Ian Franco</span> &bull; Proyecto personal de uso libre 🚀
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://ian-pontorno-portfolio.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-[#e62429] transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Portafolio</span>
            </a>
            <a 
              href="https://github.com/Ian9Franco" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a 
              href="https://www.instagram.com/ian.franco._/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modal Generador de Favicons */}
      {isFaviconModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="panel-border bg-[#111522] max-w-xl w-full p-6 relative font-mono">
            <button
              type="button"
              onClick={() => { setIsFaviconModalOpen(false); setFaviconResults(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-[#e62429]" />
              <h3 className="text-base font-bold text-white uppercase">Generador de Paquete de Favicons</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Sube tu logotipo y genera automáticamente un paquete listo para la web (`favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`).
            </p>

            <div className="mb-4">
              <label className="text-[10px] text-slate-400 block mb-1">Nombre / Prefijo del Favicon:</label>
              <input
                type="text"
                placeholder="Ej. favicon o mi_icono"
                value={faviconCustomName}
                onChange={(e) => setFaviconCustomName(e.target.value)}
                className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
              />
            </div>

            <div 
              onClick={() => faviconInputRef.current?.click()}
              className="panel-border p-6 text-center cursor-pointer border-dashed border-[#232730] hover:border-[#2563eb] bg-[#090b10] mb-6"
            >
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFaviconProcess(e.target.files[0])}
              />
              <ImageIcon className="w-8 h-8 text-[#2563eb] mx-auto mb-2" />
              <span className="text-xs font-bold text-white block">
                {faviconFile ? faviconFile.name : 'Seleccionar Logo / Imagen'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">Recomendado imagen cuadrada PNG/SVG alta resolución</span>
            </div>

            {isGeneratingFavicons && (
              <div className="text-center text-xs text-[#2563eb] animate-pulse mb-4">
                Generando variantes de favicon y site.webmanifest...
              </div>
            )}

            {faviconResults && (
              <div className="space-y-4">
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>¡Paquete de 6 iconos + site.webmanifest generado!</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] text-slate-400">
                  {faviconResults.icons.map((ic: any, idx: number) => (
                    <div key={idx} className="bg-[#090b10] p-2 rounded border border-[#232730] flex flex-col items-center">
                      <img src={`data:image/png;base64,${ic.base64}`} alt={ic.name} className="w-8 h-8 mb-1 object-contain" />
                      <input 
                        type="text" 
                        value={ic.name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setFaviconResults((prev: any) => ({
                            ...prev,
                            icons: prev.icons.map((item: any, i: number) => i === idx ? { ...item, name: val } : item)
                          }));
                        }}
                        className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-[9px] font-mono text-center text-slate-200 rounded px-1 py-0.5 outline-none truncate"
                        title="Haz clic para renombrar este archivo"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">{ic.size}x{ic.size}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={downloadFaviconZip}
                  className="w-full py-2.5 bg-[#e62429] text-white font-bold text-xs rounded hover:bg-[#ff3b30] transition shadow-md shadow-[#e62429]/30 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>DESCARGAR PAQUETE FAVICONS (.ZIP)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Comparativa */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="panel-border bg-[#111522] max-w-4xl w-full p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-mono text-sm font-bold text-white mb-1 uppercase">
              Inspección Comparativa Lado a Lado
            </h3>
            <p className="font-mono text-xs text-slate-400 mb-4">
              {selectedPreview.originalName} &bull; Dim. Final: {selectedPreview.finalWidth} × {selectedPreview.finalHeight} px
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <span className="font-mono text-xs text-slate-400 block">ORIGINAL: {formatBytes(selectedPreview.originalSizeBytes)} ({selectedPreview.originalWidth}×{selectedPreview.originalHeight}px)</span>
                <div className="aspect-square bg-[#090b10] rounded border border-[#232730] overflow-hidden">
                  <img src={selectedPreview.previewUrl} alt="Original" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-xs text-emerald-400 block">OPTIMIZADO: {formatBytes(selectedPreview.compressedSizeBytes)} ({selectedPreview.finalWidth}×{selectedPreview.finalHeight}px - Calidad {selectedPreview.qualityApplied}%)</span>
                <div className="aspect-square bg-[#090b10] rounded border border-[#e62429]/60 overflow-hidden">
                  <img src={selectedPreview.base64Data} alt="Comprimido" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => { downloadSingle(selectedPreview); setSelectedPreview(null); }}
                className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Inspector de Recorte y Formato Ads */}
      {selectedCropImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="panel-border bg-[#111522] max-w-3xl w-full p-6 relative font-mono">
            <button
              type="button"
              onClick={() => setSelectedCropImage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Crop className="w-5 h-5 text-[#e62429]" />
              <h3 className="text-base font-bold text-white uppercase">Recorte & Aspect Ratio (Google Ads / Social)</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Convierte fotos verticales u horizontales a formatos exactos sin deformar la imagen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Previsualización del Encuadre */}
              <div className="space-y-2">
                <span className="text-xs text-slate-300 font-bold block">Previsualización de Encuadre:</span>
                <div className="aspect-video bg-[#090b10] rounded border border-[#232730] overflow-hidden relative flex items-center justify-center p-2">
                  <img src={selectedCropImage.previewUrl} alt="Crop Preview" className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-2 border-2 border-dashed border-[#e62429] pointer-events-none flex items-center justify-center bg-[#e62429]/10">
                    <span className="bg-[#090b10]/80 text-[#e62429] px-2 py-0.5 rounded text-[10px] font-bold border border-[#e62429]/40">
                      Zona de Recorte ({customWidth || '1200'} × {customHeight || '628'} px)
                    </span>
                  </div>
                </div>
              </div>

              {/* Ajustes de Formato y Zona */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1.5 font-bold">1. Seleccionar Formato Objetivo:</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { label: 'Google Ads Horizontal (1200 × 628)', w: '1200', h: '628' },
                      { label: 'Banner HD (16:9 - 1920 × 1080)', w: '1920', h: '1080' },
                      { label: 'Cuadrado (1:1 - 1080 × 1080)', w: '1080', h: '1080' },
                      { label: 'Historia Vertical (9:16 - 1080 × 1920)', w: '1080', h: '1920' },
                      { label: 'Retrato (4:5 - 1080 × 1350)', w: '1080', h: '1350' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setCustomWidth(preset.w); setCustomHeight(preset.h); setCropFit('cover'); }}
                        className={`text-left px-3 py-1.5 rounded border transition ${
                          customWidth === preset.w && customHeight === preset.h
                            ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                            : 'bg-[#090b10] border-[#232730] text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5 font-bold">2. Posición / Enfoque del Recorte:</label>
                  <select
                    value={cropPosition}
                    onChange={(e) => setCropPosition(e.target.value as any)}
                    className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                  >
                    <option value="center">Centro (Recomendado)</option>
                    <option value="top">Arriba (Priorizar rostros / cabecera)</option>
                    <option value="bottom">Abajo (Priorizar base)</option>
                    <option value="entropy">IA Enfoque Inteligente (Contraste/Detalles)</option>
                    <option value="attention">IA Detección de Sujeto Principal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedCropImage(null)}
                className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedCropImage) return;
                  const targetImg = selectedCropImage;
                  setSelectedCropImage(null);
                  setImages(prev => prev.map(img => img.id === targetImg.id ? { ...img, status: 'processing' } : img));
                  
                  try {
                    const blob = await fetch(targetImg.previewUrl).then(r => r.blob());
                    const file = new File([blob], targetImg.originalName, { type: targetImg.mimeType || 'image/jpeg' });
                    
                    const formData = new FormData();
                    formData.append('file', file);
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
                    formData.append('cropFit', 'cover');
                    formData.append('cropPosition', cropPosition);

                    const res = await fetch('/api/compress', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error);

                    setImages(prev => prev.map(img => img.id === targetImg.id ? {
                      ...img,
                      status: 'done',
                      outputFileName: data.outputFileName,
                      finalWidth: data.finalWidth,
                      finalHeight: data.finalHeight,
                      compressedSizeBytes: data.compressedSizeBytes,
                      qualityApplied: data.qualityApplied,
                      formatApplied: data.formatApplied,
                      savedPercentage: data.savedPercentage,
                      base64Data: data.base64Data,
                    } : img));
                  } catch (err: any) {
                    alert('Error recortando imagen: ' + err.message);
                  }
                }}
                className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30"
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Aplicar Recorte & Recomprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
