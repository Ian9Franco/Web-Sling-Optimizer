import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sliders, 
  Maximize2, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  ShieldCheck, 
  Type, 
  Copy,
  BookmarkPlus,
  Trash2,
  Check,
  X,
  Wand2,
  Sparkles
} from 'lucide-react';
import { CropFit, CropPosition, ReprocessOverrides, CustomPreset, ProcessedImage } from '../types/image';
import { resolveFileNamePattern } from '../utils/naming';

interface SettingsPanelProps {
  preserveQuality: boolean;
  setPreserveQuality: (val: boolean) => void;
  qualityMode: 'preserve' | 'manual' | 'maxKB';
  setQualityMode: (mode: 'preserve' | 'manual' | 'maxKB') => void;
  quality: number;
  setQuality: (val: number) => void;
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
  upscaleFactor: 1 | 2 | 4;
  setUpscaleFactor: (val: 1 | 2 | 4) => void;
  clarity: boolean;
  setClarity: (val: boolean) => void;
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
  setCustomNamePattern: React.Dispatch<React.SetStateAction<string>>;
  reprocessBatch: (overrides?: ReprocessOverrides) => Promise<void>;
  images: ProcessedImage[];
  onApplyBatchRename: (pattern: string) => void;
  onApplyBatchSlugify?: () => void;
  totalImages: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  formatBytes: (bytes: number) => string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  preserveQuality,
  setPreserveQuality,
  qualityMode,
  setQualityMode,
  quality,
  setQuality,
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
  upscaleFactor,
  setUpscaleFactor,
  clarity,
  setClarity,
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
  images,
  onApplyBatchRename,
  onApplyBatchSlugify,
  totalImages,
  totalOriginalBytes,
  totalCompressedBytes,
  formatBytes,
}) => {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Cargar presets de usuario guardados en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('websling_user_presets');
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando presets de localStorage:', e);
    }
  }, []);

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: CustomPreset = {
      id: Math.random().toString(36).substring(2, 9),
      name: newPresetName.trim(),
      maxKB,
      format,
      resizeMode,
      customWidth,
      customHeight,
      cropFit,
      cropPosition,
      upscaleFactor,
      clarity,
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('websling_user_presets', JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando preset en localStorage:', e);
    }
    setNewPresetName('');
    setIsAddingPreset(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('websling_user_presets', JSON.stringify(updated));
    } catch (e) {
      console.error('Error actualizando presets en localStorage:', e);
    }
  };

  const handleApplyPreset = (preset: CustomPreset) => {
    setMaxKB(preset.maxKB);
    setFormat(preset.format);
    setResizeMode(preset.resizeMode);
    setCustomWidth(preset.customWidth);
    setCustomHeight(preset.customHeight);
    setCropFit(preset.cropFit);
    setCropPosition(preset.cropPosition);
    if (preset.upscaleFactor) setUpscaleFactor(preset.upscaleFactor);
    if (preset.clarity !== undefined) setClarity(preset.clarity);
    reprocessBatch({
      maxKB: preset.maxKB,
      format: preset.format,
      resizeMode: preset.resizeMode,
      customWidth: preset.customWidth,
      customHeight: preset.customHeight,
      cropFit: preset.cropFit,
      cropPosition: preset.cropPosition,
      upscaleFactor: preset.upscaleFactor,
      clarity: preset.clarity,
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets Rápidos de 1-Clic */}
      <div className="panel-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-bold uppercase">
            <Zap className="w-3.5 h-3.5 text-[#e62429]" />
            <span>Presets de 1-Clic</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingPreset(prev => !prev)}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#14161b] border border-[#232730] hover:border-[#2563eb] transition"
            title="Guardar los ajustes actuales como un preset reutilizable"
          >
            <BookmarkPlus className="w-3 h-3 text-[#2563eb]" />
            <span>Guardar Actual</span>
          </button>
        </div>

        {/* Input para guardar preset nuevo */}
        {isAddingPreset && (
          <div className="bg-[#0c0d10] p-2.5 rounded border border-[#2563eb]/50 space-y-2 font-mono text-xs">
            <label className="text-[10px] text-slate-400 block">Nombre del Preset:</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Ej. Mi Blog (800px, 80KB)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCurrentAsPreset(); }}
                className="flex-1 bg-[#14161b] border border-[#232730] text-xs px-2 py-1 rounded text-white outline-none focus:border-[#2563eb]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCurrentAsPreset}
                className="p-1.5 bg-[#2563eb] text-white rounded hover:bg-[#3b82f6]"
                title="Confirmar"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPreset(false)}
                className="p-1.5 bg-[#14161b] text-slate-400 rounded hover:text-white border border-[#232730]"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Presets Nativos */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => { 
              setPreserveQuality(false);
              setMaxKB(100); setResizeMode('custom'); setCustomWidth('800'); setCustomHeight('800'); setFormat('webp'); setCropFit('cover');
              reprocessBatch({ preserveQuality: false, maxKB: 100, resizeMode: 'custom', customWidth: '800', customHeight: '800', format: 'webp', cropFit: 'cover' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">E-commerce</span>
            <span className="text-slate-400">800px &bull; 100KB</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              setPreserveQuality(false);
              setMaxKB(200); setResizeMode('custom'); setCustomWidth('1080'); setCustomHeight('1080'); setFormat('jpg'); setCropFit('cover');
              reprocessBatch({ preserveQuality: false, maxKB: 200, resizeMode: 'custom', customWidth: '1080', customHeight: '1080', format: 'jpg', cropFit: 'cover' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">Redes Social</span>
            <span className="text-slate-400">1080px &bull; 200KB</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              setPreserveQuality(false);
              setMaxKB(50); setResizeMode('custom'); setCustomWidth('500'); setCustomHeight(''); setFormat('webp'); setCropFit('inside');
              reprocessBatch({ preserveQuality: false, maxKB: 50, resizeMode: 'custom', customWidth: '500', customHeight: '', format: 'webp', cropFit: 'inside' });
            }}
            className="p-2 text-[10px] font-mono bg-[#14161b] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 text-left transition"
          >
            <span className="block font-bold text-white">Emailing</span>
            <span className="text-slate-400">500px &bull; 50KB</span>
          </button>
        </div>

        {/* Presets Personalizados de Usuario */}
        {customPresets.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#232730]">
            <span className="text-[10px] font-mono text-slate-400 block font-bold">Mis Presets Guardados:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {customPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2 text-[10px] font-mono bg-[#0c0d10] hover:border-[#2563eb] border border-[#232730] rounded text-slate-300 cursor-pointer transition relative group flex justify-between items-start"
                >
                  <div className="truncate pr-4">
                    <span className="block font-bold text-white truncate">{preset.name}</span>
                    <span className="text-slate-400 block text-[9px]">
                      {preset.customWidth ? `${preset.customWidth}px` : 'Auto'} &bull; {preset.maxKB}KB &bull; {preset.format.toUpperCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition p-0.5"
                    title="Eliminar preset guardado"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel-border p-5 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#232730]">
          <Sliders className="w-4 h-4 text-[#e62429]" />
          <h2 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
            Parámetros de Compresión
          </h2>
        </div>

        {/* Modo de Compresión: Preservar vs Calidad (%) vs Límite KB */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Tratamiento de Calidad:</span>
            <span className={
              qualityMode === 'preserve' 
                ? 'text-emerald-400 font-bold' 
                : qualityMode === 'manual'
                  ? 'text-[#2563eb] font-bold'
                  : 'text-[#e62429] font-bold'
            }>
              {qualityMode === 'preserve' 
                ? '100% Original' 
                : qualityMode === 'manual'
                  ? `Calidad: ${quality}%`
                  : `Objetivo: ${maxKB} KB`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => { setQualityMode('preserve'); setPreserveQuality(true); }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded border font-mono text-[11px] transition ${
                qualityMode === 'preserve'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
              title="No reduce la calidad visual. Mantiene máxima nitidez sin degradación."
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Sin Pérdida</span>
            </button>

            <button
              type="button"
              onClick={() => { setQualityMode('manual'); setPreserveQuality(false); }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded border font-mono text-[11px] transition ${
                qualityMode === 'manual'
                  ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-md shadow-[#2563eb]/30'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
              title="Define directamente el porcentaje de calidad de compresión (ej. 80%, 85%)."
            >
              <Sliders className="w-3 h-3" />
              <span>Calidad %</span>
            </button>

            <button
              type="button"
              onClick={() => { setQualityMode('maxKB'); setPreserveQuality(false); }}
              className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded border font-mono text-[11px] transition ${
                qualityMode === 'maxKB'
                  ? 'bg-[#e62429] border-[#e62429] text-white font-bold shadow-md shadow-[#e62429]/30'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
              title="Reduce progresivamente la calidad hasta que el archivo pese menos de X KB."
            >
              <Zap className="w-3 h-3" />
              <span>Límite KB</span>
            </button>
          </div>

          {qualityMode === 'preserve' && (
            <div className="bg-[#0c0d10] border border-emerald-500/20 p-2.5 rounded text-[11px] font-mono text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Calidad visual intacta</span>
              </div>
              <p className="text-[10px] text-slate-400">
                La nitidez y compresión original no se tocan. La reducción de calidad está desactivada.
              </p>
            </div>
          )}

          {qualityMode === 'manual' && (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Calidad de Salida:</span>
                <span className="text-[#2563eb] font-bold text-sm">{quality}%</span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />

              <div className="grid grid-cols-5 gap-1 pt-0.5">
                {[60, 75, 80, 85, 90].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuality(val)}
                    className={`text-[10px] font-mono py-1 rounded border transition ${
                      quality === val
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow-sm shadow-[#2563eb]/30'
                        : 'bg-[#14161b] border-[#232730] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {qualityMode === 'maxKB' && (
            <div className="space-y-3 pt-1">
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
                className="w-full h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer accent-[#e62429]"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
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
          )}
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

        {/* Super-Resolución (Upscaling) & Claridad HD */}
        <div className="space-y-3 pt-3 border-t border-[#232730]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Super-Resolución & Claridad</span>
            </label>
            <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
              Lanczos3 HD
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {[
              { factor: 1 as const, label: '1x Normal', desc: 'Sin escala' },
              { factor: 2 as const, label: '2x HD', desc: '+100% res' },
              { factor: 4 as const, label: '4x 4K', desc: '+300% res' },
            ].map((item) => (
              <button
                key={item.factor}
                type="button"
                onClick={() => {
                  setUpscaleFactor(item.factor);
                  reprocessBatch({ upscaleFactor: item.factor, clarity });
                }}
                className={`py-1.5 px-1 rounded border text-center transition flex flex-col items-center justify-center ${
                  upscaleFactor === item.factor
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-xs">{item.label}</span>
                <span className="text-[9px] opacity-70">{item.desc}</span>
              </button>
            ))}
          </div>

          <label className="flex items-start gap-2 cursor-pointer text-slate-300 pt-1 font-mono text-xs">
            <input
              type="checkbox"
              checked={clarity}
              onChange={(e) => {
                const checked = e.target.checked;
                setClarity(checked);
                reprocessBatch({ upscaleFactor, clarity: checked });
              }}
              className="mt-0.5 rounded accent-amber-500"
            />
            <div className="space-y-0.5">
              <span className="flex items-center gap-1 font-bold text-slate-200">
                <span>Claridad HD & Filtro Antidesenfoque</span>
              </span>
              <p className="text-[10px] text-slate-500 leading-tight">
                Aplica Unsharp Masking + Denoise para resaltar texturas y bordes sin artefactos.
              </p>
            </div>
          </label>
        </div>

        {/* Formato de Salida */}
        <div className="space-y-2 pt-3 border-t border-[#232730]">
          <div className="flex justify-between items-center">
            <label className="text-xs font-mono text-slate-400 block">Formato de Salida</label>
            <span className="text-[10px] font-mono text-slate-500">Web &amp; Especiales</span>
          </div>
          <select
            value={format}
            onChange={(e) => {
              const val = e.target.value;
              setFormat(val);
              reprocessBatch({ format: val });
            }}
            className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded-lg p-2.5 text-slate-200 outline-none cursor-pointer"
          >
            <optgroup label="Estándares Web">
              <option value="original">Original (Mantener o Auto JPG)</option>
              <option value="webp">WebP (Optimizado Web)</option>
              <option value="jpg">JPG (Máxima Compatibilidad)</option>
              <option value="png">PNG (Sin Pérdida / Alpha)</option>
              <option value="avif">AVIF (Ultra Compresión Moderna)</option>
            </optgroup>
            <optgroup label="Formatos Especiales &amp; Raros">
              <option value="tiff">TIFF / TIF (Edición &amp; Impresión Pro)</option>
              <option value="gif">GIF (Frame Estático Web)</option>
              <option value="heic">HEIC / HEIF (Apple Pro Format)</option>
            </optgroup>
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

          {/* Nombre de Archivo Personalizado / Patrón Dinámico */}
          <div className="space-y-2 pt-2 border-t border-[#232730]">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <label className="flex items-center gap-1 text-slate-300 font-bold">
                <Copy className="w-3 h-3 text-[#2563eb]" />
                <span>Patrón de Renombrado en Lote</span>
              </label>
              {onApplyBatchSlugify && (
                <button
                  type="button"
                  onClick={onApplyBatchSlugify}
                  className="flex items-center gap-1 text-[#2563eb] hover:text-[#3b82f6] transition"
                  title="Limpiar automáticamente nombres a kebab-case y generar Alt text para todos"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Auto-Slugify</span>
                </button>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Ej. {slug}-{width}x{height}"
              value={customNamePattern}
              onChange={(e) => setCustomNamePattern(e.target.value)}
              className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
            />

            {/* Tokens rápidos */}
            <div className="flex flex-wrap gap-1 text-[9px] font-mono">
              {[
                { label: '{original}', token: '{original}' },
                { label: '{slug}', token: '{slug}' },
                { label: '{width}', token: '{width}' },
                { label: '{height}', token: '{height}' },
                { label: '{quality}', token: '{quality}' },
                { label: '{format}', token: '{format}' },
                { label: '{index}', token: '{index}' },
                { label: '{0index}', token: '{0index}' },
              ].map((t) => (
                <button
                  key={t.token}
                  type="button"
                  onClick={() => setCustomNamePattern(prev => `${prev}${t.token}`)}
                  className="bg-[#14161b] hover:border-[#2563eb] border border-[#232730] text-slate-400 hover:text-white px-1.5 py-0.5 rounded transition"
                  title={`Insertar comodín ${t.token}`}
                >
                  +{t.label}
                </button>
              ))}
            </div>

            {/* Vista previa dinámica de renombramiento cuando se ingresa un patrón */}
            {customNamePattern.trim() ? (() => {
              const hasRealImage = images && images.length > 0;
              const sampleImg = hasRealImage 
                ? images[0] 
                : { 
                    originalName: 'foto-ejemplo.jpg', 
                    outputFileName: 'foto-ejemplo.jpg', 
                    originalWidth: 1920,
                    originalHeight: 1080,
                    finalWidth: 1200, 
                    finalHeight: 800, 
                    qualityApplied: quality || 85,
                    formatApplied: format !== 'original' ? format.toUpperCase() : 'WEBP' 
                  };
              const previewResult = resolveFileNamePattern(customNamePattern, sampleImg as any, 0);

              return (
                <div className="bg-[#0c0d10] border border-[#232730] p-2.5 rounded text-[10px] font-mono space-y-1">
                  <div className="text-slate-400 text-[9px] uppercase tracking-wider flex items-center justify-between">
                    <span>{hasRealImage ? 'Vista Previa (1ra imagen):' : 'Ejemplo de Salida:'}</span>
                    <span className="text-[#2563eb] font-normal">{hasRealImage ? 'En vivo' : 'Simulación'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-slate-300 pt-0.5">
                    <span className="text-slate-400 truncate">{sampleImg.originalName}</span>
                    <span className="text-[#2563eb] font-bold">➔</span>
                    <span className="text-emerald-400 font-bold truncate">{previewResult}</span>
                  </div>
                </div>
              );
            })() : null}

            {/* Botón de aplicación inmediata al lote */}
            <button
              type="button"
              onClick={() => onApplyBatchRename(customNamePattern)}
              disabled={!customNamePattern.trim() || totalImages === 0}
              className="w-full py-2 px-2 bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-40 disabled:hover:bg-[#2563eb] text-white font-mono text-xs font-bold rounded transition flex items-center justify-center gap-1.5 shadow-sm shadow-[#2563eb]/30"
              title="Aplica este patrón inmediatamente a los nombres de salida de las imágenes actuales"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Aplicar al Lote {totalImages > 0 ? `(${totalImages})` : ''}</span>
            </button>
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
