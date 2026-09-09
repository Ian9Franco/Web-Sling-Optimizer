import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Download, ChevronsLeftRight, Columns, SplitSquareVertical, Sliders, RotateCw, Sparkles, Info } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface PreviewModalProps {
  selectedPreview: ProcessedImage | null;
  onClose: () => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  formatBytes: (bytes: number) => string;
  onReprocessSingle?: (img: ProcessedImage, quality: number) => Promise<ProcessedImage | null>;
  onInspectMetadata?: (img: ProcessedImage) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  selectedPreview,
  onClose,
  onDownloadSingle,
  formatBytes,
  onReprocessSingle,
  onInspectMetadata,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [currentQuality, setCurrentQuality] = useState<number>(selectedPreview?.qualityApplied || 85);
  const [isReprocessing, setIsReprocessing] = useState<boolean>(false);
  const [previewImg, setPreviewImg] = useState<ProcessedImage | null>(selectedPreview);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPreview) {
      setPreviewImg(selectedPreview);
      setCurrentQuality(selectedPreview.qualityApplied || 85);
    }
  }, [selectedPreview]);

  const handleApplyQuality = async (newQuality: number) => {
    if (!previewImg || !onReprocessSingle) return;
    setCurrentQuality(newQuality);
    setIsReprocessing(true);
    try {
      const updated = await onReprocessSingle(previewImg, newQuality);
      if (updated) {
        setPreviewImg(updated);
      }
    } catch (err) {
      console.error('Error aplicando calidad en modal:', err);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSliderPosition(percentage);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!previewImg) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel-border bg-[#111522] max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative font-mono shadow-2xl">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 p-1.5 text-slate-300 hover:text-white bg-[#090b10] hover:bg-[#1c2438] border border-[#232730] hover:border-slate-500 rounded-lg transition cursor-pointer shadow-md"
          title="Cerrar modal (Esc)"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pr-8">
          <div>
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <span>Inspección de Calidad Visual</span>
              {previewImg.savedPercentage >= 0 ? (
                <span className="text-emerald-400 text-xs font-bold">
                  (-{previewImg.savedPercentage}%)
                </span>
              ) : (
                <span className="text-amber-400 text-xs font-bold">
                  (+{Math.abs(previewImg.savedPercentage)}%)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {previewImg.originalName} &bull; Final: {previewImg.finalWidth} × {previewImg.finalHeight} px
            </p>
          </div>

          {/* Toggle de Modo: Slider vs Lado a Lado */}
          <div className="flex bg-[#090b10] border border-[#232730] rounded p-0.5 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                viewMode === 'slider'
                  ? 'bg-[#2563eb] text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Slider</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                viewMode === 'side-by-side'
                  ? 'bg-[#2563eb] text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Lado a Lado</span>
            </button>
          </div>
        </div>

        {/* Barra de Ajuste Fino de Calidad en Vivo */}
        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg mb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#2563eb]" />
              <span className="text-slate-300 font-bold">Ajustar Calidad:</span>
              <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {currentQuality}% ({previewImg.formatApplied || 'JPG'})
              </span>
              {isReprocessing && (
                <span className="text-[#2563eb] text-[11px] animate-pulse flex items-center gap-1">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Optimizando...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px]">
              {[60, 75, 80, 85, 90, 100].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleApplyQuality(q)}
                  disabled={isReprocessing}
                  className={`px-2 py-0.5 rounded border transition ${
                    currentQuality === q
                      ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                      : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {q}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono">10%</span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={currentQuality}
              disabled={isReprocessing}
              onChange={(e) => setCurrentQuality(parseInt(e.target.value))}
              onMouseUp={() => handleApplyQuality(currentQuality)}
              onTouchEnd={() => handleApplyQuality(currentQuality)}
              className="flex-1 h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
            />
            <span className="text-[10px] text-slate-500 font-mono">100%</span>
            <button
              type="button"
              onClick={() => handleApplyQuality(currentQuality)}
              disabled={isReprocessing}
              className="px-3 py-1 text-xs font-bold bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-50 text-white rounded transition shadow-sm shadow-[#2563eb]/20"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Modo Slider Interactivo */}
        {viewMode === 'slider' ? (
          <div className="space-y-2 mb-6">
            <div
              ref={containerRef}
              onPointerMove={(e) => {
                if (e.buttons === 1) handlePointerMove(e);
              }}
              onClick={handlePointerMove}
              className="relative w-full aspect-video max-h-[50vh] bg-[#090b10] rounded-lg border border-[#232730] overflow-hidden select-none cursor-ew-resize touch-none flex items-center justify-center"
            >
              {/* Capa Inferior: Imagen Optimizada */}
              <img
                src={previewImg.base64Data}
                alt="Comprimido"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Capa Superior Recortada: Imagen Original */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={previewImg.previewUrl}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Línea Divisoria Deslizable */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#e62429] shadow-[0_0_10px_rgba(230,36,41,0.8)] pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Agarradera Central */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#090b10] border-2 border-[#e62429] flex items-center justify-center text-white shadow-lg">
                  <ChevronsLeftRight className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Etiquetas Flotantes */}
              <div className="absolute top-3 left-3 bg-[#090b10]/85 border border-[#232730] px-2.5 py-1 rounded text-[11px] text-slate-300 pointer-events-none backdrop-blur">
                Original: <span className="text-white font-bold">{formatBytes(previewImg.originalSizeBytes)}</span>
              </div>
              <div className="absolute top-3 right-3 bg-[#090b10]/85 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] text-emerald-400 pointer-events-none backdrop-blur">
                Optimizado: <span className="text-white font-bold">{formatBytes(previewImg.compressedSizeBytes)}</span> ({previewImg.qualityApplied}%)
              </div>
            </div>

            {/* Input Slider Auxiliar para Accesibilidad */}
            <div className="flex items-center gap-3 text-xs text-slate-400 px-1">
              <span>Original (0%)</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                className="flex-1 h-1 bg-[#232730] rounded appearance-none cursor-ew-resize accent-[#e62429]"
              />
              <span>Optimizado (100%)</span>
            </div>
          </div>
        ) : (
          /* Modo Lado a Lado */
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 block">
                ORIGINAL: {formatBytes(previewImg.originalSizeBytes)} ({previewImg.originalWidth}×{previewImg.originalHeight}px)
              </span>
              <div className="aspect-square bg-[#090b10] rounded border border-[#232730] overflow-hidden">
                <img src={previewImg.previewUrl} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-emerald-400 block">
                OPTIMIZADO: {formatBytes(previewImg.compressedSizeBytes)} ({previewImg.finalWidth}×{previewImg.finalHeight}px - {previewImg.qualityApplied}%)
              </span>
              <div className="aspect-square bg-[#090b10] rounded border border-[#e62429]/60 overflow-hidden">
                <img src={previewImg.base64Data} alt="Comprimido" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            {onInspectMetadata && (
              <button
                type="button"
                onClick={() => {
                  onInspectMetadata(previewImg);
                }}
                className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white rounded flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Inspeccionar Metadatos & IA</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded hover:border-slate-600 transition"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => { onDownloadSingle(previewImg); onClose(); }}
              className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
