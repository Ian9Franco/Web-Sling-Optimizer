'use client';

import React from 'react';
import { Download, Trash2, Code } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface ImageGridProps {
  images: ProcessedImage[];
  onUpdateOutputFileName: (id: string, name: string) => void;
  onSelectSrcset: (img: ProcessedImage) => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  onRemoveSingle: (id: string) => void;
  formatBytes: (bytes: number) => string;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onUpdateOutputFileName,
  onSelectSrcset,
  onDownloadSingle,
  onRemoveSingle,
  formatBytes,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {images.map((img) => (
        <div key={img.id} className="panel-border p-4 space-y-3 relative group">
          <button
            type="button"
            onClick={() => onRemoveSingle(img.id)}
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
              onChange={(e) => onUpdateOutputFileName(img.id, e.target.value)}
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelectSrcset(img)}
                className="py-1.5 px-2 bg-[#0c0d10] text-[#2563eb] hover:text-white border border-[#232730] hover:border-[#2563eb] font-mono text-xs rounded transition flex items-center justify-center gap-1"
                title="Generar <picture> & srcset responsive"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Srcset</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadSingle(img)}
                className="flex-1 py-1.5 bg-[#e62429] text-white font-mono font-bold text-xs rounded hover:bg-[#ff3b30] transition shadow-md shadow-[#e62429]/30 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
