'use client';

import React from 'react';
import { Crop, Eye, Download, Trash2 } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface ImageTableProps {
  images: ProcessedImage[];
  onUpdateOutputFileName: (id: string, name: string) => void;
  onSelectCropImage: (img: ProcessedImage) => void;
  onSelectPreview: (img: ProcessedImage) => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  onRemoveSingle: (id: string) => void;
  formatBytes: (bytes: number) => string;
}

export const ImageTable: React.FC<ImageTableProps> = ({
  images,
  onUpdateOutputFileName,
  onSelectCropImage,
  onSelectPreview,
  onDownloadSingle,
  onRemoveSingle,
  formatBytes,
}) => {
  return (
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
                  onChange={(e) => onUpdateOutputFileName(img.id, e.target.value)}
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
                        onClick={() => onSelectCropImage(img)}
                        className="p-1.5 rounded bg-[#0c0d10] text-[#e62429] hover:text-white border border-[#232730]"
                        title="Recortar / Formato Ads"
                      >
                        <Crop className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPreview(img)}
                        className="p-1.5 rounded bg-[#0c0d10] text-slate-400 hover:text-white border border-[#232730]"
                        title="Ver Comparativa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(img)}
                        className="p-1.5 rounded bg-[#e62429] text-white font-bold hover:bg-[#ff3b30] shadow-sm shadow-[#e62429]/30"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveSingle(img.id)}
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
  );
};
