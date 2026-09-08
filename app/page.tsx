'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CropFit, CropPosition } from '../types/image';
import { Navbar } from '../components/Navbar';
import { SettingsPanel } from '../components/SettingsPanel';
import { VisualizationPanel } from '../components/VisualizationPanel';
import { CropModal } from '../components/CropModal';
import { FaviconModal } from '../components/FaviconModal';
import { PreviewModal } from '../components/PreviewModal';
import { SrcsetModal } from '../components/SrcsetModal';
import { AIConfigModal } from '../components/AIConfigModal';
import { AIInteractionPreview } from '../components/AIInteractionPreview';
import { LiquidGridBackground } from '../components/LiquidGridBackground';
import { Footer } from '../components/Footer';
import { GlobalDropOverlay } from '../components/GlobalDropOverlay';
import { useGlobalDrop } from '../hooks/useGlobalDrop';
import { useFaviconGenerator } from '../hooks/useFaviconGenerator';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { useAISettings } from '../hooks/useAISettings';

export default function HomePage() {
  // Configuración de Compresión y Calidad
  const [preserveQuality, setPreserveQuality] = useState<boolean>(true);
  const [qualityMode, setQualityMode] = useState<'preserve' | 'manual' | 'maxKB'>('preserve');
  const [quality, setQuality] = useState<number>(85);
  const [maxKB, setMaxKB] = useState<number>(200);
  const [format, setFormat] = useState<string>('original');

  // Redimensionamiento y Recorte
  const [resizeMode, setResizeMode] = useState<'none' | 'custom'>('none');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [cropFit, setCropFit] = useState<CropFit>('inside');
  const [cropPosition, setCropPosition] = useState<CropPosition>('center');

  // Edición y Seguridad
  const [rotate, setRotate] = useState<number>(0);
  const [flip, setFlip] = useState<boolean>(false);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [stripExif, setStripExif] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [customNamePattern, setCustomNamePattern] = useState<string>('');

  // Modo de visualización de la lista
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Configuración de IA Multimodal (Google Gemini / OpenAI)
  const { settings: aiSettings, updateSettings: updateAISettings, isConfigured: isAIConfigured } = useAISettings();
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Motor de Procesamiento de Imágenes
  const {
    images,
    setImages,
    isZipping,
    selectedPreview,
    setSelectedPreview,
    selectedSrcsetImage,
    setSelectedSrcsetImage,
    selectedCropImage,
    setSelectedCropImage,
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
  } = useImageProcessor({
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
  });

  // Generador de Favicons
  const {
    isFaviconModalOpen,
    setIsFaviconModalOpen,
    closeFaviconModal,
    faviconFile,
    faviconCustomName,
    setFaviconCustomName,
    faviconResults,
    setFaviconResults,
    isGeneratingFavicons,
    handleFaviconProcess,
    downloadFaviconZip,
  } = useFaviconGenerator();

  // Drag & Drop global y pegado por portapapeles
  const { isDragging } = useGlobalDrop({
    onFiles: handleFiles,
  });

  // Layout responsivo: sincronización de altura entre panel de edición y panel de visualización
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setLeftColHeight(Math.round(entry.contentRect.height));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Proteger contra recargas o cierres accidentales si hay imágenes cargadas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (images.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [images.length]);

  // Formateador de bytes legible
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-[#090b10] min-h-screen font-sans text-slate-200 antialiased pb-16 relative overflow-x-hidden">
      {/* Dynamic Interactive Liquid Grid Background */}
      <LiquidGridBackground />

      {/* Overlay Drag & Drop Global */}
      <GlobalDropOverlay isDragging={isDragging} />

      {/* Navbar Superior */}
      <Navbar
        onOpenFaviconModal={() => setIsFaviconModalOpen(true)}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        isAIConfigured={isAIConfigured}
        hasImages={images.length > 0}
        totalSavedBytes={totalSavedBytes}
        overallSavedPercent={overallSavedPercent}
        formatBytes={formatBytes}
      />

      {/* Main Workspace Layout (Solid, elevated above animated background) */}
      <main className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center">
          
          {/* Columna 1: Panel de Control (Edición / Presets) */}
          <div 
            ref={leftColRef}
            className="w-full lg:w-[490px] xl:w-[510px] flex-shrink-0"
          >
            <SettingsPanel
              preserveQuality={preserveQuality}
              setPreserveQuality={setPreserveQuality}
              qualityMode={qualityMode}
              setQualityMode={setQualityMode}
              quality={quality}
              setQuality={setQuality}
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
              images={images}
              onApplyBatchRename={applyBatchRename}
              onApplyBatchSlugify={applyBatchSlugify}
              totalImages={images.length}
              totalOriginalBytes={totalOriginalBytes}
              totalCompressedBytes={totalCompressedBytes}
              formatBytes={formatBytes}
            />
          </div>

          {/* Columna Derecha: Dropzone y Visualización */}
          <VisualizationPanel
            images={images}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isDragging={isDragging}
            isDesktop={isDesktop}
            leftColHeight={leftColHeight}
            isZipping={isZipping}
            onFilesSelected={handleFiles}
            onReprocessBatch={() => reprocessBatch()}
            onClearImages={() => setImages([])}
            onDownloadAllZip={downloadAllZip}
            onUpdateOutputFileName={updateOutputFileName}
            onUpdateAltText={updateAltText}
            onSelectCropImage={setSelectedCropImage}
            onSelectPreview={setSelectedPreview}
            onSelectSrcset={setSelectedSrcsetImage}
            onDownloadSingle={downloadSingle}
            onRemoveSingle={removeSingleImage}
            formatBytes={formatBytes}
            onAnalyzeSingleAI={(img) => analyzeSingleAI(img, aiSettings, () => setIsAIModalOpen(true))}
            analyzingId={analyzingId}
            onBatchAI={() => analyzeBatchAI(aiSettings, () => setIsAIModalOpen(true))}
            isAnalyzingAI={isAnalyzingAI}
          />
        </div>
      </main>

      {/* Mini Popup Interacción con Modelo IA (Aparece a la derecha abajo al comenzar y se cierra al terminar) */}
      <AIInteractionPreview
        state={aiInteraction}
        onClose={closeAiInteraction}
      />

      {/* Footer Copyright */}
      <Footer />

      {/* Modal Configuración de IA Multimodal */}
      <AIConfigModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        settings={aiSettings}
        onSaveSettings={updateAISettings}
      />

      {/* Modal Generador de Favicons */}
      <FaviconModal
        isOpen={isFaviconModalOpen}
        onClose={closeFaviconModal}
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
        onReprocessSingle={handleReprocessSingle}
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
