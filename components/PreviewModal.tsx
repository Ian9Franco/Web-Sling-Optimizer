'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, Download, ChevronsLeftRight, Columns, SplitSquareVertical } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface PreviewModalProps {
  selectedPreview: ProcessedImage | null;
  onClose: () => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  formatBytes: (bytes: number) => string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  selectedPreview,
  onClose,
  onDownloadSingle,
  formatBytes,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = Math.round((x / rect.width) * 100);
    setSliderPosition(percentage);
  }, []);

  if (!selectedPreview) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="panel-border bg-[#111522] max-w-4xl w-full p-6 relative font-mono">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pr-8">
          <div>
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <span>Inspección de Calidad Visual</span>
              <span className="text-emerald-400 text-xs font-normal">
                (-{selectedPreview.savedPercentage}%)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {selectedPreview.originalName} &bull; Final: {selectedPreview.finalWidth} × {selectedPreview.finalHeight} px
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

        {/* Modo Slider Interactivo */}
        {viewMode === 'slider' ? (
          <div className="space-y-2 mb-6">
            <div
              ref={containerRef}
              onPointerMove={(e) => {
                if (e.buttons === 1) handlePointerMove(e);
              }}
              onClick={handlePointerMove}
              className="relative w-full aspect-video max-h-[55vh] bg-[#090b10] rounded-lg border border-[#232730] overflow-hidden select-none cursor-ew-resize touch-none flex items-center justify-center"
            >
              {/* Capa Inferior: Imagen Optimizada */}
              <img
                src={selectedPreview.base64Data}
                alt="Comprimido"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Capa Superior Recortada: Imagen Original */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={selectedPreview.previewUrl}
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
                Original: <span className="text-white font-bold">{formatBytes(selectedPreview.originalSizeBytes)}</span>
              </div>
              <div className="absolute top-3 right-3 bg-[#090b10]/85 border border-emerald-500/30 px-2.5 py-1 rounded text-[11px] text-emerald-400 pointer-events-none backdrop-blur">
                Optimizado: <span className="text-white font-bold">{formatBytes(selectedPreview.compressedSizeBytes)}</span> ({selectedPreview.qualityApplied}%)
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
                ORIGINAL: {formatBytes(selectedPreview.originalSizeBytes)} ({selectedPreview.originalWidth}×{selectedPreview.originalHeight}px)
              </span>
              <div className="aspect-square bg-[#090b10] rounded border border-[#232730] overflow-hidden">
                <img src={selectedPreview.previewUrl} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-emerald-400 block">
                OPTIMIZADO: {formatBytes(selectedPreview.compressedSizeBytes)} ({selectedPreview.finalWidth}×{selectedPreview.finalHeight}px - {selectedPreview.qualityApplied}%)
              </span>
              <div className="aspect-square bg-[#090b10] rounded border border-[#e62429]/60 overflow-hidden">
                <img src={selectedPreview.base64Data} alt="Comprimido" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded hover:border-slate-600 transition"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => { onDownloadSingle(selectedPreview); onClose(); }}
            className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
