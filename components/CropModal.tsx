'use client';

import React from 'react';
import { Crop, X, Sparkles } from 'lucide-react';
import { ProcessedImage, CropFit, CropPosition, ContainBackground } from '../types/image';

interface CropModalProps {
  selectedImage: ProcessedImage | null;
  onClose: () => void;
  customWidth: string;
  setCustomWidth: (val: string) => void;
  customHeight: string;
  setCustomHeight: (val: string) => void;
  cropFit: CropFit;
  setCropFit: (val: CropFit) => void;
  cropPosition: CropPosition;
  setCropPosition: (val: CropPosition) => void;
  containBackground?: ContainBackground;
  setContainBackground?: (val: ContainBackground) => void;
  onApplyCrop: (img: ProcessedImage) => Promise<void>;
}

export const CropModal: React.FC<CropModalProps> = ({
  selectedImage,
  onClose,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  cropFit,
  setCropFit,
  cropPosition,
  setCropPosition,
  containBackground = 'blur',
  setContainBackground,
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
          Convierte fotos verticales u horizontales a formatos exactos sin deformar la imagen ni perder contenido.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Previsualización del Encuadre */}
          <div className="space-y-2">
            <span className="text-xs text-slate-300 font-bold block">Previsualización de Encuadre:</span>
            <div className="aspect-video bg-[#090b10] rounded border border-[#232730] overflow-hidden relative flex items-center justify-center p-2">
              <img src={selectedImage.previewUrl} alt="Crop Preview" className="max-w-full max-h-full object-contain" />
              <div className={`absolute inset-2 border-2 border-dashed ${cropFit === 'contain' ? 'border-purple-500 bg-purple-500/10' : 'border-[#e62429] bg-[#e62429]/10'} pointer-events-none flex items-center justify-center`}>
                <span className={`bg-[#090b10]/90 ${cropFit === 'contain' ? 'text-purple-300 border-purple-500/40' : 'text-[#e62429] border-[#e62429]/40'} px-2 py-0.5 rounded text-[10px] font-bold border`}>
                  {cropFit === 'contain' ? 'Relleno sin Recortar' : 'Zona de Recorte'} ({customWidth || '1200'} × {customHeight || '628'} px)
                </span>
              </div>
            </div>
          </div>

          {/* Ajustes de Formato y Zona */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1.5 font-bold">1. Formato Objetivo:</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: 'Google Ads Horizontal (1200 × 628)', w: '1200', h: '628', defaultFit: 'cover' as const },
                  { label: 'Banner HD (16:9 - 1920 × 1080)', w: '1920', h: '1080', defaultFit: 'cover' as const },
                  { label: 'Cuadrado (1:1 - 1080 × 1080)', w: '1080', h: '1080', defaultFit: 'cover' as const },
                  { label: 'Historia Vertical (9:16 - 1080 × 1920)', w: '1080', h: '1920', defaultFit: 'contain' as const },
                  { label: 'Retrato (4:5 - 1080 × 1350)', w: '1080', h: '1350', defaultFit: 'cover' as const },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { 
                      setCustomWidth(preset.w); 
                      setCustomHeight(preset.h); 
                      setCropFit(preset.defaultFit); 
                    }}
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

            {/* Selector de Modo: Recortar vs Rellenar Bordes */}
            <div>
              <label className="text-slate-400 block mb-1 font-bold">2. Tratamiento de Imagen:</label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setCropFit('cover')}
                  className={`py-1.5 px-2 rounded border text-center transition ${
                    cropFit === 'cover'
                      ? 'bg-[#e62429] border-[#e62429] text-white font-bold'
                      : 'bg-[#090b10] border-[#232730] text-slate-400'
                  }`}
                >
                  Recortar Marco (Cover)
                </button>
                <button
                  type="button"
                  onClick={() => setCropFit('contain')}
                  className={`py-1.5 px-2 rounded border text-center transition ${
                    cropFit === 'contain'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-[#090b10] border-[#232730] text-slate-400'
                  }`}
                  title="No corta nada de la imagen. Agrega bordes desenfocados o de color."
                >
                  Rellenar Bordes (Contain)
                </button>
              </div>
            </div>

            {/* Opciones según el modo elegido */}
            {cropFit === 'contain' ? (
              <div>
                <label className="text-purple-300 block mb-1 font-bold">Fondo de Relleno:</label>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {[
                    { id: 'blur' as const, label: '🌌 Blur Pro' },
                    { id: 'black' as const, label: '⚫ Negro' },
                    { id: 'white' as const, label: '⚪ Blanco' },
                    { id: 'transparent' as const, label: '🔳 Alpha' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setContainBackground && setContainBackground(bg.id)}
                      className={`py-1 rounded border text-center transition ${
                        containBackground === bg.id
                          ? 'bg-purple-600 border-purple-400 text-white font-bold'
                          : 'bg-[#090b10] border-[#232730] text-slate-400'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Enfoque del Recorte:</label>
                <select
                  value={cropPosition}
                  onChange={(e) => setCropPosition(e.target.value as CropPosition)}
                  className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                >
                  <option value="center">Centro (Recomendado)</option>
                  <option value="top">Arriba (Priorizar rostros / cabecera)</option>
                  <option value="bottom">Abajo (Priorizar base)</option>
                  <option value="entropy">IA Enfoque Inteligente (Detalles)</option>
                  <option value="attention">IA Detección de Sujeto Principal</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onApplyCrop(selectedImage)}
            className="px-4 py-2 bg-[#e62429] text-white font-bold rounded flex items-center gap-1.5 hover:bg-[#ff3b30] shadow-md shadow-[#e62429]/30"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Aplicar & Recomprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
