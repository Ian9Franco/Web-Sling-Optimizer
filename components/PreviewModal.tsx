'use client';

import React from 'react';
import { X, Download } from 'lucide-react';
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
  if (!selectedPreview) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="panel-border bg-[#111522] max-w-4xl w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
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
            <span className="font-mono text-xs text-slate-400 block">
              ORIGINAL: {formatBytes(selectedPreview.originalSizeBytes)} ({selectedPreview.originalWidth}×{selectedPreview.originalHeight}px)
            </span>
            <div className="aspect-square bg-[#090b10] rounded border border-[#232730] overflow-hidden">
              <img src={selectedPreview.previewUrl} alt="Original" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs text-emerald-400 block">
              OPTIMIZADO: {formatBytes(selectedPreview.compressedSizeBytes)} ({selectedPreview.finalWidth}×{selectedPreview.finalHeight}px - Calidad {selectedPreview.qualityApplied}%)
            </span>
            <div className="aspect-square bg-[#090b10] rounded border border-[#e62429]/60 overflow-hidden">
              <img src={selectedPreview.base64Data} alt="Comprimido" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => { onDownloadSingle(selectedPreview); onClose(); }}
            className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
