'use client';

import React from 'react';
import { Download, Trash2, Code, Bot } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface ImageGridProps {
  images: ProcessedImage[];
  onUpdateOutputFileName: (id: string, name: string) => void;
  onUpdateAltText?: (id: string, alt: string) => void;
  onSelectSrcset: (img: ProcessedImage) => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  onRemoveSingle: (id: string) => void;
  formatBytes: (bytes: number) => string;
  onAnalyzeSingleAI?: (img: ProcessedImage) => void;
  analyzingId?: string | null;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onUpdateOutputFileName,
  onUpdateAltText,
  onSelectSrcset,
  onDownloadSingle,
  onRemoveSingle,
  formatBytes,
  onAnalyzeSingleAI,
  analyzingId,
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
            <img src={img.base64Data || img.previewUrl} alt={img.altText || img.originalName} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-0.5">
                <label className="text-[9px] text-slate-400">Nombre SEO:</label>
                {onAnalyzeSingleAI && (
                  <button
                    type="button"
                    onClick={() => onAnalyzeSingleAI(img)}
                    disabled={analyzingId === img.id}
                    className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-white px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 transition disabled:opacity-40"
                    title="Analizar con IA (Generar Nombre SEO y Texto ALT)"
                  >
                    <Bot className={`w-3 h-3 ${analyzingId === img.id ? 'animate-spin' : ''}`} />
                    <span>IA SEO</span>
                  </button>
                )}
              </div>
              <input 
                type="text" 
                value={img.outputFileName} 
                onChange={(e) => onUpdateOutputFileName(img.id, e.target.value)}
                className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono font-bold text-white px-2 py-1 rounded outline-none"
                title="Editar nombre de salida de este archivo"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Texto ALT:</label>
              <input 
                type="text" 
                value={img.altText || ''} 
                placeholder="Texto ALT para SEO..."
                onChange={(e) => onUpdateAltText && onUpdateAltText(img.id, e.target.value)}
                className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-[11px] font-sans text-slate-200 px-2 py-0.5 rounded outline-none placeholder:text-slate-600"
                title="Texto alternativo para SEO"
              />
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              Orig: {img.originalName}
            </div>
            {img.status === 'done' && (
              <>
                <div className="text-slate-400 flex justify-between text-[11px]">
                  <span>Dimensiones:</span>
                  <span className="text-slate-200">{img.finalWidth} × {img.finalHeight} px</span>
                </div>
                <div className="text-slate-400 flex justify-between text-[11px]">
                  <span>Calidad:</span>
                  <span className="text-slate-200 font-semibold">{img.qualityApplied}% ({img.formatApplied})</span>
                </div>
                <div className="text-slate-400 flex justify-between text-[11px]">
                  <span>Peso:</span>
                  {img.savedPercentage > 0 ? (
                    <span className="text-emerald-400 font-bold">{formatBytes(img.compressedSizeBytes)} (-{img.savedPercentage}%)</span>
                  ) : img.savedPercentage === 0 ? (
                    <span className="text-slate-200 font-bold">{formatBytes(img.compressedSizeBytes)} (Óptimo)</span>
                  ) : (
                    <span className="text-amber-400 font-bold">{formatBytes(img.compressedSizeBytes)} (+{Math.abs(img.savedPercentage)}%)</span>
                  )}
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
