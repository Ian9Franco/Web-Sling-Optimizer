'use client';

import React from 'react';
import { Crop, X } from 'lucide-react';
import { ProcessedImage, CropFit, CropPosition } from '../types/image';

interface CropModalProps {
  selectedImage: ProcessedImage | null;
  onClose: () => void;
  customWidth: string;
  setCustomWidth: (val: string) => void;
  customHeight: string;
  setCustomHeight: (val: string) => void;
  setCropFit: (val: CropFit) => void;
  cropPosition: CropPosition;
  setCropPosition: (val: CropPosition) => void;
  onApplyCrop: (img: ProcessedImage) => Promise<void>;
}

export const CropModal: React.FC<CropModalProps> = ({
  selectedImage,
  onClose,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  setCropFit,
  cropPosition,
  setCropPosition,
  onApplyCrop,
}) => {
  if (!selectedImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="panel-border bg-[#111522] max-w-3xl w-full p-6 relative font-mono">
        <button
          type="button"
          onClick={onClose}
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
              <img src={selectedImage.previewUrl} alt="Crop Preview" className="max-w-full max-h-full object-contain" />
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
                onChange={(e) => setCropPosition(e.target.value as CropPosition)}
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
            onClick={onClose}
            className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApplyCrop(selectedImage)}
            className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Aplicar Recorte & Recomprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
