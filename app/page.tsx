'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  LayoutGrid,
  List
} from 'lucide-react';

import { 
  ProcessedImage, 
  CropFit, 
  CropPosition, 
  ReprocessOverrides,
  FaviconResponse,
  FileSystemEntryItem 
} from '../types/image';
import { asyncPool } from '../utils/concurrency';
import { Navbar } from '../components/Navbar';
import { SettingsPanel } from '../components/SettingsPanel';
import { UploadZone } from '../components/UploadZone';
import { ImageTable } from '../components/ImageTable';
import { ImageGrid } from '../components/ImageGrid';
import { CropModal } from '../components/CropModal';
import { FaviconModal } from '../components/FaviconModal';
import { PreviewModal } from '../components/PreviewModal';
import { SrcsetModal } from '../components/SrcsetModal';
import { Footer } from '../components/Footer';

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
  const [selectedSrcsetImage, setSelectedSrcsetImage] = useState<ProcessedImage | null>(null);

  // Opciones avanzadas de edición y seguridad
  const [rotate, setRotate] = useState<number>(0);
  const [flip, setFlip] = useState<boolean>(false);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [stripExif, setStripExif] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [customNamePattern, setCustomNamePattern] = useState<string>('');

  // Opciones de Recorte y Aspect Ratio
  const [cropFit, setCropFit] = useState<CropFit>('inside');
  const [cropPosition, setCropPosition] = useState<CropPosition>('center');
  const [selectedCropImage, setSelectedCropImage] = useState<ProcessedImage | null>(null);

  // Modal de Favicons
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconCustomName, setFaviconCustomName] = useState<string>('favicon');
  const [faviconResults, setFaviconResults] = useState<FaviconResponse | null>(null);
  const [isGeneratingFavicons, setIsGeneratingFavicons] = useState(false);

  // Helper para formatear bytes legibles
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper para escanear carpetas recursivamente
  const scanEntry = async (entry: FileSystemEntryItem): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => resolve([file]), () => resolve([]));
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readEntries = async (): Promise<FileSystemEntryItem[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries((entries: FileSystemEntryItem[]) => resolve(entries), () => resolve([]));
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

  // Procesador de DataTransfer para drag & drop de zips, carpetas y archivos sueltos
  const processDataTransfer = async (dataTransfer: DataTransfer) => {
    const extractedFiles: File[] = [];
    const items = Array.from(dataTransfer.items || []);
    const entries: FileSystemEntryItem[] = [];

    for (const item of items) {
      if ('webkitGetAsEntry' in item && typeof (item as any).webkitGetAsEntry === 'function') {
        const entry = (item as any).webkitGetAsEntry() as FileSystemEntryItem | null;
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

    // Pegar imagen directamente desde el portapapeles (Ctrl + V)
    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        handleFiles(pastedFiles);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('paste', handleWindowPaste);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('paste', handleWindowPaste);
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

    // Procesamiento con concurrencia controlada (3 tareas simultáneas)
    await asyncPool(3, validFiles, async (file, i) => {
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
        formData.append('index', (i + 1).toString());
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

  // Re-procesar todas las imágenes cargadas con concurrencia de 3 en paralelo
  const reprocessBatch = async (overrides?: ReprocessOverrides) => {
    const targetKB = overrides?.maxKB ?? maxKB;
    const targetMode = overrides?.resizeMode ?? resizeMode;
    const targetWidth = overrides?.customWidth ?? customWidth;
    const targetHeight = overrides?.customHeight ?? customHeight;
    const targetFormat = overrides?.format ?? format;
    const targetFit = overrides?.cropFit ?? cropFit;
    const targetPosition = overrides?.cropPosition ?? cropPosition;

    const list = [...images];
    if (list.length === 0) return;

    await asyncPool(3, list, async (img, idx) => {
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
        formData.append('index', (idx + 1).toString());
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error procesando favicons';
      alert(errorMsg);
    } finally {
      setIsGeneratingFavicons(false);
    }
  };

  const downloadFaviconZip = async () => {
    if (!faviconResults) return;
    try {
      const zip = new JSZip();
      faviconResults.icons.forEach((icon) => {
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

  // Aplicar Recorte desde el Modal Crop
  const handleApplyCrop = async (targetImg: ProcessedImage) => {
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      alert('Error recortando imagen: ' + errorMsg);
    }
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
      <Navbar
        onOpenFaviconModal={() => setIsFaviconModalOpen(true)}
        hasImages={images.length > 0}
        totalSavedBytes={totalSavedBytes}
        overallSavedPercent={overallSavedPercent}
        formatBytes={formatBytes}
      />

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Panel de Control (4 Cols) */}
          <div className="lg:col-span-4">
            <SettingsPanel
              maxKB={maxKB}
              setMaxKB={setMaxKB}
              resizeMode={resizeMode}
              setResizeMode={setResizeMode}
              customWidth={customWidth}
              setCustomWidth={setCustomWidth}
              customHeight={customHeight}
              setCustomHeight={setCustomHeight}
              cropFit={cropFit}
              setCropFit={setCropFit}
              cropPosition={cropPosition}
              setCropPosition={setCropPosition}
              format={format}
              setFormat={setFormat}
              rotate={rotate}
              setRotate={setRotate}
              flip={flip}
              setFlip={setFlip}
              grayscale={grayscale}
              setGrayscale={setGrayscale}
              stripExif={stripExif}
              setStripExif={setStripExif}
              watermarkText={watermarkText}
              setWatermarkText={setWatermarkText}
              customNamePattern={customNamePattern}
              setCustomNamePattern={setCustomNamePattern}
              reprocessBatch={reprocessBatch}
              totalImages={images.length}
              totalOriginalBytes={totalOriginalBytes}
              totalCompressedBytes={totalCompressedBytes}
              formatBytes={formatBytes}
            />
          </div>

          {/* Columna Derecha: Dropzone y Tabla/Grid (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <UploadZone
              onFilesSelected={handleFiles}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
            />

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
              <ImageTable
                images={images}
                onUpdateOutputFileName={updateOutputFileName}
                onSelectCropImage={setSelectedCropImage}
                onSelectPreview={setSelectedPreview}
                onSelectSrcset={setSelectedSrcsetImage}
                onDownloadSingle={downloadSingle}
                onRemoveSingle={removeSingleImage}
                formatBytes={formatBytes}
              />
            )}

            {/* Vista Grid */}
            {images.length > 0 && viewMode === 'grid' && (
              <ImageGrid
                images={images}
                onUpdateOutputFileName={updateOutputFileName}
                onSelectSrcset={setSelectedSrcsetImage}
                onDownloadSingle={downloadSingle}
                onRemoveSingle={removeSingleImage}
                formatBytes={formatBytes}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <Footer />

      {/* Modal Generador de Favicons */}
      <FaviconModal
        isOpen={isFaviconModalOpen}
        onClose={() => { setIsFaviconModalOpen(false); setFaviconResults(null); }}
        faviconCustomName={faviconCustomName}
        setFaviconCustomName={setFaviconCustomName}
        faviconFile={faviconFile}
        faviconResults={faviconResults}
        setFaviconResults={setFaviconResults}
        isGeneratingFavicons={isGeneratingFavicons}
        handleFaviconProcess={handleFaviconProcess}
        downloadFaviconZip={downloadFaviconZip}
      />

      {/* Modal Comparativa */}
      <PreviewModal
        selectedPreview={selectedPreview}
        onClose={() => setSelectedPreview(null)}
        onDownloadSingle={downloadSingle}
        formatBytes={formatBytes}
      />

      {/* Modal Inspector de Recorte y Formato Ads */}
      <CropModal
        selectedImage={selectedCropImage}
        onClose={() => setSelectedCropImage(null)}
        customWidth={customWidth}
        setCustomWidth={setCustomWidth}
        customHeight={customHeight}
        setCustomHeight={setCustomHeight}
        setCropFit={setCropFit}
        cropPosition={cropPosition}
        setCropPosition={setCropPosition}
        onApplyCrop={handleApplyCrop}
      />

      {/* Modal Snippet Srcset y Picture Responsive */}
      <SrcsetModal
        image={selectedSrcsetImage}
        onClose={() => setSelectedSrcsetImage(null)}
      />
    </div>
  );
}
