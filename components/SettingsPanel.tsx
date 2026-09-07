'use client';

import React from 'react';
import { 
  Zap, 
  Sliders, 
  Maximize2, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  ShieldCheck, 
  Type, 
  Copy 
} from 'lucide-react';
import { CropFit, CropPosition, ReprocessOverrides } from '../types/image';

interface SettingsPanelProps {
  maxKB: number;
  setMaxKB: (val: number) => void;
  resizeMode: 'none' | 'custom';
  setResizeMode: (val: 'none' | 'custom') => void;
  customWidth: string;
  setCustomWidth: (val: string) => void;
  customHeight: string;
  setCustomHeight: (val: string) => void;
  cropFit: CropFit;
  setCropFit: (val: CropFit) => void;
  cropPosition: CropPosition;
  setCropPosition: (val: CropPosition) => void;
  format: string;
  setFormat: (val: string) => void;
  rotate: number;
  setRotate: React.Dispatch<React.SetStateAction<number>>;
  flip: boolean;
  setFlip: React.Dispatch<React.SetStateAction<boolean>>;
  grayscale: boolean;
  setGrayscale: (val: boolean) => void;
  stripExif: boolean;
  setStripExif: (val: boolean) => void;
  watermarkText: string;
  setWatermarkText: (val: string) => void;
  customNamePattern: string;
  setCustomNamePattern: (val: string) => void;
  reprocessBatch: (overrides?: ReprocessOverrides) => Promise<void>;
  totalImages: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  formatBytes: (bytes: number) => string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  maxKB,
  setMaxKB,
  resizeMode,
  setResizeMode,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  cropFit,
  setCropFit,
  cropPosition,
  setCropPosition,
  format,
  setFormat,
  rotate,
  setRotate,
  flip,
  setFlip,
  grayscale,
  setGrayscale,
  stripExif,
  setStripExif,
  watermarkText,
  setWatermarkText,
  customNamePattern,
  setCustomNamePattern,
  reprocessBatch,
  totalImages,
  totalOriginalBytes,
  totalCompressedBytes,
  formatBytes,
}) => {
  return (
    <div className="space-y-6">
      {/* Presets Rápidos de 1-Clic */}
      <div className="panel-border p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold uppercase">
          <Zap className="w-3.5 h-3.5 text-[#e62429]" />
          <span>Presets de 1-Clic</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => { 
              setMaxKB(100); setResizeMode('custom'); setCustomWidth('800'); setCustomHeight('800'); setFormat('webp'); setCropFit('cover');
              reprocessBatch({ maxKB: 100, resizeMode: 'custom', customWidth: '800', customHeight: '800', format: 'webp', cropFit: 'cover' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">E-commerce</span>
            <span className="text-slate-400">800px &bull; 100KB</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              setMaxKB(200); setResizeMode('custom'); setCustomWidth('1080'); setCustomHeight('1080'); setFormat('jpg'); setCropFit('cover');
              reprocessBatch({ maxKB: 200, resizeMode: 'custom', customWidth: '1080', customHeight: '1080', format: 'jpg', cropFit: 'cover' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">Redes Social</span>
            <span className="text-slate-400">1080px &bull; 200KB</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              setMaxKB(50); setResizeMode('custom'); setCustomWidth('500'); setCustomHeight(''); setFormat('webp'); setCropFit('inside');
              reprocessBatch({ maxKB: 50, resizeMode: 'custom', customWidth: '500', customHeight: '', format: 'webp', cropFit: 'inside' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">Emailing</span>
            <span className="text-slate-400">500px &bull; 50KB</span>
          </button>
        </div>
      </div>

      <div className="panel-border p-5 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#232730]">
          <Sliders className="w-4 h-4 text-[#e62429]" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
            Parámetros de Compresión
          </h2>
        </div>

        {/* Límite de Peso */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Peso Máximo Objetivo:</span>
            <span className="text-[#e62429] font-bold text-sm">{maxKB} KB</span>
          </div>

          <input
            type="range"
            min="30"
            max="1000"
            step="10"
            value={maxKB}
            onChange={(e) => setMaxKB(parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer"
          />

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[100, 200, 300, 500].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setMaxKB(val)}
                className={`text-[11px] font-mono py-1.5 rounded border transition ${
                  maxKB === val
                    ? 'bg-[#e62429] border-[#e62429] text-white font-bold shadow-md shadow-[#e62429]/30'
                    : 'bg-[#14161b] border-[#232730] text-slate-400 hover:border-slate-600'
                }`}
              >
                {val} KB
              </button>
            ))}
          </div>
        </div>

        {/* Control de Dimensiones */}
        <div className="space-y-3 pt-3 border-t border-[#232730]">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Dimensiones:</span>
            <span className="text-slate-200 font-semibold">
              {resizeMode === 'none' ? 'Originales' : 'Personalizadas'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResizeMode('none')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border font-mono text-xs transition ${
                resizeMode === 'none'
                  ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-md shadow-[#2563eb]/30'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Sin Alterar</span>
            </button>

            <button
              type="button"
              onClick={() => setResizeMode('custom')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded border font-mono text-xs transition ${
                resizeMode === 'custom'
                  ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-md shadow-[#2563eb]/30'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Personalizar</span>
            </button>
          </div>

          {/* Campos para dimensiones personalizadas */}
          {resizeMode === 'custom' && (
            <div className="space-y-3 pt-2 bg-[#0c0d10] p-3 rounded-lg border border-[#232730]">
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ancho máx (px)</label>
                  <input
                    type="number"
                    placeholder="Ej. 1920"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] rounded p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Alto máx (px)</label>
                  <input
                    type="number"
                    placeholder="Auto (opcional)"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] rounded p-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* Presets de dimensiones y Ads */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">Presets Rápidos & Formatos Ads:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Google Ads (1200x628)', w: '1200', h: '628', fit: 'cover' },
                    { label: 'Banner (1920x1080)', w: '1920', h: '1080', fit: 'cover' },
                    { label: 'Cuadrado (1080x1080)', w: '1080', h: '1080', fit: 'cover' },
                    { label: 'Historia (1080x1920)', w: '1080', h: '1920', fit: 'cover' },
                    { label: 'Retrato (1080x1350)', w: '1080', h: '1350', fit: 'cover' },
                    { label: 'Libre HD (1280)', w: '1280', h: '', fit: 'inside' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { 
                        setCustomWidth(preset.w); 
                        setCustomHeight(preset.h); 
                        setCropFit(preset.fit as CropFit);
                        setResizeMode('custom');
                        reprocessBatch({ customWidth: preset.w, customHeight: preset.h, cropFit: preset.fit as CropFit, resizeMode: 'custom' });
                      }}
                      className="text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] text-slate-300 px-2 py-1 rounded transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo de Ajuste: Escalar vs Recortar */}
              <div className="space-y-2 pt-2 border-t border-[#232730]">
                <label className="text-[10px] font-mono text-slate-400 block font-bold">Modo de Recorte (Sin Estirar):</label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCropFit('inside')}
                    className={`py-1.5 px-2 rounded border text-center transition ${
                      cropFit === 'inside'
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                        : 'bg-[#14161b] border-[#232730] text-slate-400'
                    }`}
                  >
                    Sin Cortar (Escalar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropFit('cover')}
                    className={`py-1.5 px-2 rounded border text-center transition ${
                      cropFit === 'cover'
                        ? 'bg-[#e62429] border-[#e62429] text-white font-bold'
                        : 'bg-[#14161b] border-[#232730] text-slate-400'
                    }`}
                  >
                    Recortar Formato Exacto
                  </button>
                </div>
              </div>

              {/* Enfoque / Zona de Recorte */}
              {cropFit === 'cover' && (
                <div className="space-y-1.5 pt-2 border-t border-[#232730]">
                  <label className="text-[10px] font-mono text-slate-400 block font-bold">Enfoque / Zona de Recorte:</label>
                  <select
                    value={cropPosition}
                    onChange={(e) => setCropPosition(e.target.value as CropPosition)}
                    className="w-full bg-[#14161b] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                  >
                    <option value="center">Centro (Default)</option>
                    <option value="top">Arriba (Priorizar Cabecera)</option>
                    <option value="bottom">Abajo (Priorizar Base)</option>
                    <option value="entropy">IA Enfoque Inteligente (Detalles)</option>
                    <option value="attention">IA Detección de Sujeto / Rostros</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formato de Salida */}
        <div className="space-y-2 pt-3 border-t border-[#232730]">
          <label className="text-xs font-mono text-slate-400 block">Formato de Salida</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded-lg p-2.5 text-slate-200 outline-none"
          >
            <option value="original">Original (Auto JPG si excede KB)</option>
            <option value="webp">WebP (Optimizado Web)</option>
            <option value="jpg">JPG (Máxima Compatibilidad)</option>
            <option value="png">PNG (Indexado de Calidad)</option>
          </select>
        </div>

        {/* Herramientas de Edición & Seguridad */}
        <div className="space-y-3 pt-3 border-t border-[#232730]">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-300">Edición & Seguridad EXIF</span>
          </div>

          {/* Rotación y Espejo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRotate(prev => (prev + 90) % 360)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border font-mono text-xs transition ${
                rotate > 0
                  ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotar {rotate}°</span>
            </button>

            <button
              type="button"
              onClick={() => setFlip(prev => !prev)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border font-mono text-xs transition ${
                flip
                  ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{flip ? 'Espejado ON' : 'Espejar'}</span>
            </button>
          </div>

          {/* Grayscale y EXIF */}
          <div className="space-y-2 font-mono text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="rounded accent-[#e62429]"
              />
              <span>Convertir a Blanco y Negro</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={stripExif}
                onChange={(e) => setStripExif(e.target.checked)}
                className="rounded accent-[#e62429]"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Limpiar Metadatos EXIF / GPS</span>
              </span>
            </label>
          </div>

          {/* Marca de Agua */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Type className="w-3 h-3 text-[#e62429]" />
              <span>Marca de Agua en Texto (opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. © MiMarca.com"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
            />
          </div>

          {/* Nombre de Archivo Personalizado / Prefijo */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Copy className="w-3 h-3 text-[#2563eb]" />
              <span>Renombrar Archivo en Compresión (opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. producto_optimizada"
              value={customNamePattern}
              onChange={(e) => setCustomNamePattern(e.target.value)}
              className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Resumen de Lote */}
      {totalImages > 0 && (
        <div className="panel-border p-5 font-mono text-xs space-y-3">
          <div className="text-slate-400 uppercase tracking-wider text-[10px] pb-2 border-b border-[#232730]">
            Resumen de Lote
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Procesadas:</span>
            <span className="text-white font-bold">{totalImages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Peso Original:</span>
            <span className="text-slate-300">{formatBytes(totalOriginalBytes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Peso Optimizado:</span>
            <span className="text-emerald-400 font-bold">{formatBytes(totalCompressedBytes)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
