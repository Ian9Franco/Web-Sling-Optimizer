'use client';

import React from 'react';
import { Crop, Eye, Download, Trash2, Code, Bot } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface ImageTableProps {
  images: ProcessedImage[];
  onUpdateOutputFileName: (id: string, name: string) => void;
  onUpdateAltText?: (id: string, alt: string) => void;
  onSelectCropImage: (img: ProcessedImage) => void;
  onSelectPreview: (img: ProcessedImage) => void;
  onSelectSrcset: (img: ProcessedImage) => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  onRemoveSingle: (id: string) => void;
  formatBytes: (bytes: number) => string;
  onAnalyzeSingleAI?: (img: ProcessedImage) => void;
  analyzingId?: string | null;
}

export const ImageTable: React.FC<ImageTableProps> = ({
  images,
  onUpdateOutputFileName,
  onUpdateAltText,
  onSelectCropImage,
  onSelectPreview,
  onSelectSrcset,
  onDownloadSingle,
  onRemoveSingle,
  formatBytes,
  onAnalyzeSingleAI,
  analyzingId,
}) => {
  return (
    <div className="panel-border overflow-hidden w-full">
      <table className="w-full text-left font-mono text-xs table-auto">
        <thead className="bg-[#0c0d10] border-b border-[#232730] text-slate-400 uppercase text-[9px] tracking-wider">
          <tr>
            <th className="py-2.5 px-2 w-12 text-center">Img</th>
            <th className="py-2.5 px-2">Nombre & Alt (SEO)</th>
            <th className="py-2.5 px-2 whitespace-nowrap">Dimensiones</th>
            <th className="py-2.5 px-2 whitespace-nowrap">Peso</th>
            <th className="py-2.5 px-2 whitespace-nowrap">Calidad</th>
            <th className="py-2.5 px-2 text-right whitespace-nowrap">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232730]">
          {images.map((img) => (
            <tr key={img.id} className="hover:bg-[#181d2e] transition">
              {/* Columna Miniatura */}
              <td className="py-2 px-2 align-middle text-center w-12">
                <div className="w-9 h-9 mx-auto rounded bg-[#0c0d10] overflow-hidden border border-[#232730]">
                  <img 
                    src={img.base64Data || img.previewUrl} 
                    alt={img.altText || img.originalName} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </td>

              {/* Columna Nombre & ALT */}
              <td className="py-2 px-2 align-middle min-w-0">
                <div className="space-y-1">
                  <div className="flex gap-1 items-center">
                    <input 
                      type="text" 
                      value={img.outputFileName} 
                      onChange={(e) => onUpdateOutputFileName(img.id, e.target.value)}
                      className="w-full min-w-0 bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-[11px] font-mono font-semibold text-white px-2 py-0.5 rounded outline-none"
                      title="Editar nombre de salida del archivo (SEO)"
                    />
                    {onAnalyzeSingleAI && (
                      <button
                        type="button"
                        onClick={() => onAnalyzeSingleAI(img)}
                        disabled={analyzingId === img.id}
                        className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-white hover:border-emerald-500 transition disabled:opacity-40 flex-shrink-0"
                        title="Analizar con IA (Generar Nombre SEO y Texto ALT)"
                      >
                        <Bot className={`w-3.5 h-3.5 ${analyzingId === img.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={img.altText || ''} 
                      placeholder="Texto ALT (Accesibilidad & SEO)..."
                      onChange={(e) => onUpdateAltText && onUpdateAltText(img.id, e.target.value)}
                      className="w-full min-w-0 bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-[10.5px] font-sans text-slate-300 placeholder:text-slate-600 px-2 py-0.5 rounded outline-none"
                      title="Texto alternativo para SEO y lectores de pantalla"
                    />
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono truncate max-w-[220px]">
                    Orig: <span className="text-slate-400">{img.originalName}</span>
                  </div>
                </div>
              </td>

              {/* Columna Dimensiones */}
              <td className="py-2 px-2 align-middle text-slate-400 whitespace-nowrap text-[11px]">
                {img.status === 'done' ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-200 font-medium">
                        {img.finalWidth} × {img.finalHeight} px
                      </span>
                      {img.upscaleApplied && img.upscaleApplied > 1 && (
                        <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-1 rounded">
                          🌟 {img.upscaleApplied}X
                        </span>
                      )}
                    </div>
                    {(img.originalWidth > 0 && img.originalHeight > 0 && (img.finalWidth !== img.originalWidth || img.finalHeight !== img.originalHeight)) ? (
                      <span className="block text-[9.5px] text-amber-400">
                        Orig: {img.originalWidth} × {img.originalHeight}
                      </span>
                    ) : (
                      <span className="block text-[9.5px] text-emerald-400">
                        100% Original
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[10px]">Calculando...</span>
                )}
              </td>

              {/* Columna Peso */}
              <td className="py-2 px-2 align-middle whitespace-nowrap text-[11px]">
                {img.status === 'done' ? (
                  <div>
                    {img.savedPercentage > 0 ? (
                      <>
                        <span className="text-emerald-400 font-bold">{formatBytes(img.compressedSizeBytes)}</span>
                        <span className="text-slate-500 block text-[9.5px]">de {formatBytes(img.originalSizeBytes)} (-{img.savedPercentage}%)</span>
                      </>
                    ) : img.savedPercentage === 0 ? (
                      <>
                        <span className="text-slate-200 font-bold">{formatBytes(img.compressedSizeBytes)}</span>
                        <span className="text-slate-400 block text-[9.5px]">de {formatBytes(img.originalSizeBytes)} (Óptimo)</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-400 font-bold">{formatBytes(img.compressedSizeBytes)}</span>
                        <span className="text-amber-400/90 block text-[9.5px]">de {formatBytes(img.originalSizeBytes)} (+{Math.abs(img.savedPercentage)}%)</span>
                      </>
                    )}
                    {img.originalSizeBytes > 4.5 * 1024 * 1024 && (
                      <span className="block text-[8.5px] text-emerald-400 font-semibold">
                        ⚡ Auto-adaptado (&gt; 4.5MB)
                      </span>
                    )}
                  </div>
                ) : img.status === 'processing' ? (
                  <span className="text-[#2563eb] animate-pulse text-[11px]">Comprimiendo...</span>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-rose-400 block font-bold text-[11px]">Error</span>
                    <span className="text-[9px] text-rose-400 block max-w-[120px] truncate">
                      {img.errorMessage || 'Error en proceso'}
                    </span>
                  </div>
                )}
              </td>

              {/* Columna Calidad */}
              <td className="py-2 px-2 align-middle text-slate-400 whitespace-nowrap text-[10.5px]">
                {img.status === 'done' ? (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap bg-[#0c0d10] border border-[#232730] px-1.5 py-0.5 rounded text-[10px]">
                      <span className="text-slate-200 font-semibold">{img.qualityApplied}%</span>
                      <span className="text-slate-400">({img.formatApplied})</span>
                    </span>
                    {img.clarityApplied && (
                      <span className="block text-[9px] font-mono text-amber-400/90 font-medium">
                        ✨ Claridad HD
                      </span>
                    )}
                  </div>
                ) : '-'}
              </td>

              {/* Columna Acciones */}
              <td className="py-2 px-2 align-middle text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  {img.status === 'done' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectSrcset(img)}
                        className="p-1 rounded bg-[#0c0d10] text-[#2563eb] hover:text-white border border-[#232730] transition"
                        title="Generar <picture> & srcset responsive"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCropImage(img)}
                        className="p-1 rounded bg-[#0c0d10] text-[#e62429] hover:text-white border border-[#232730] transition"
                        title="Recortar / Formato Ads"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPreview(img)}
                        className="p-1 rounded bg-[#0c0d10] text-slate-400 hover:text-white border border-[#232730] transition"
                        title="Ver Comparativa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(img)}
                        className="p-1 rounded bg-[#e62429] text-white font-bold hover:bg-[#ff3b30] shadow-sm shadow-[#e62429]/30 transition"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveSingle(img.id)}
                    className="p-1 rounded bg-[#0c0d10] text-slate-400 hover:text-rose-400 border border-[#232730] transition"
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
  );
};
