'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crop, 
  X, 
  Sparkles, 
  Grid3X3, 
  Crosshair, 
  Square, 
  Layers, 
  Palette, 
  Sliders,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Circle,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
} from 'lucide-react';
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
  borderPadding?: number;
  setBorderPadding?: (val: number) => void;
  onApplyCrop: (img: ProcessedImage) => Promise<void>;
}

type GuideType = 'thirds' | 'center' | 'safe' | 'none';

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
  borderPadding = 0,
  setBorderPadding,
  onApplyCrop,
}) => {
  const [activeGuide, setActiveGuide] = useState<GuideType>('thirds');
  const [customHexColor, setCustomHexColor] = useState<string>('#111522');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Escuchar tecla Escape para cierre fluido
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!selectedImage) return null;

  // Cálculo del ratio de aspecto objetivo
  const targetW = parseInt(customWidth || '1200', 10) || 1200;
  const targetH = parseInt(customHeight || '628', 10) || 628;
  const aspectRatio = targetW / targetH;

  // Determinación del estilo de alineación en preview
  const getObjectPositionStyle = (pos: CropPosition): string => {
    switch (pos) {
      case 'top':
      case 'north':
        return 'center top';
      case 'top-left':
      case 'northwest':
        return 'left top';
      case 'top-right':
      case 'northeast':
        return 'right top';
      case 'bottom':
      case 'south':
        return 'center bottom';
      case 'bottom-left':
      case 'southwest':
        return 'left bottom';
      case 'bottom-right':
      case 'southeast':
        return 'right bottom';
      case 'left':
      case 'west':
        return 'left center';
      case 'right':
      case 'east':
        return 'right center';
      case 'center':
      default:
        return 'center center';
    }
  };

  const isCustomColor = containBackground && !['blur', 'black', 'white', 'transparent'].includes(containBackground);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApplyCrop(selectedImage);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel-border bg-[#111522] max-w-4xl w-full max-h-[94vh] overflow-y-auto p-4 sm:p-6 relative font-mono shadow-2xl">
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 p-1.5 text-slate-300 hover:text-white bg-[#090b10] hover:bg-[#1c2438] border border-[#232730] hover:border-slate-500 rounded-lg transition cursor-pointer shadow-md"
          title="Cerrar modal (Esc)"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <Crop className="w-5 h-5 text-[#e62429]" />
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Estudio de Encuadre, Guías & Bordes
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedImage.originalName} &bull; Medida final:{' '}
              <span className="text-emerald-400 font-bold">{targetW} × {targetH} px</span> (Ratio {aspectRatio.toFixed(2)})
            </p>
          </div>
        </div>

        {/* Contenido Principal en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          
          {/* COLUMNA IZQUIERDA: Canvas de Previsualización Interactiva con Guías (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Previsualización en Vivo:</span>
              </span>

              {/* Selector de Guías Visuales */}
              <div className="flex items-center bg-[#090b10] border border-[#232730] rounded p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveGuide(activeGuide === 'thirds' ? 'none' : 'thirds')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                    activeGuide === 'thirds'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Regla de Tercios (3x3)"
                >
                  <Grid3X3 className="w-3 h-3" />
                  <span>Tercios</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuide(activeGuide === 'center' ? 'none' : 'center')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                    activeGuide === 'center'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cruceta Central y Ejes"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Centro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuide(activeGuide === 'safe' ? 'none' : 'safe')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                    activeGuide === 'safe'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Área Segura (80%)"
                >
                  <Square className="w-3 h-3" />
                  <span>Segura</span>
                </button>
              </div>
            </div>

            {/* Contenedor del Canvas con Aspect Ratio Dinámico */}
            <div 
              className="relative w-full bg-[#080a0e] rounded-lg border-2 border-[#232730] overflow-hidden flex items-center justify-center p-2 min-h-[260px] max-h-[420px]"
              style={{
                backgroundImage: containBackground === 'transparent' ? 'linear-gradient(45deg, #161a24 25%, transparent 25%), linear-gradient(-45deg, #161a24 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #161a24 75%), linear-gradient(-45deg, transparent 75%, #161a24 75%)' : undefined,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              {/* Marco Objetivo proporcional */}
              <div 
                className="relative max-w-full max-h-full overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-200"
                style={{
                  aspectRatio: `${targetW} / ${targetH}`,
                  width: aspectRatio >= 1 ? '100%' : 'auto',
                  height: aspectRatio < 1 ? '380px' : 'auto',
                  maxHeight: '380px',
                  backgroundColor: isCustomColor 
                    ? containBackground 
                    : containBackground === 'black' 
                      ? '#000000' 
                      : containBackground === 'white' 
                        ? '#ffffff' 
                        : containBackground === 'transparent' 
                          ? 'transparent' 
                          : '#090b10',
                }}
              >
                {/* Capa de Fondo Desenfocado si containBackground === 'blur' */}
                {containBackground === 'blur' && (
                  <img
                    src={selectedImage.previewUrl}
                    alt="Blurred Background"
                    className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-70 filter brightness-75 pointer-events-none"
                  />
                )}

                {/* Capa de Imagen de Primer Plano escalada según grosor de borde / padding */}
                <div 
                  className="relative transition-all duration-200 flex items-center justify-center w-full h-full"
                  style={{
                    padding: `${borderPadding}%`,
                  }}
                >
                  <img
                    src={selectedImage.previewUrl}
                    alt="Framed preview"
                    className="w-full h-full transition-all duration-200 pointer-events-none"
                    style={{
                      objectFit: cropFit === 'contain' ? 'contain' : 'cover',
                      objectPosition: getObjectPositionStyle(cropPosition),
                    }}
                  />
                </div>

                {/* GUÍAS VISUALES INTERACTIVAS */}
                {activeGuide === 'thirds' && (
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                    {/* Líneas horizontales y verticales */}
                    <div className="border-r border-b border-cyan-400/40 relative">
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                    </div>
                    <div className="border-r border-b border-cyan-400/40 relative">
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                    </div>
                    <div className="border-b border-cyan-400/40"></div>
                    <div className="border-r border-b border-cyan-400/40 relative">
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                    </div>
                    <div className="border-r border-b border-cyan-400/40 relative">
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></div>
                    </div>
                    <div className="border-b border-cyan-400/40"></div>
                    <div className="border-r border-cyan-400/40"></div>
                    <div className="border-r border-cyan-400/40"></div>
                    <div></div>
                  </div>
                )}

                {activeGuide === 'center' && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    {/* Eje Horizontal */}
                    <div className="absolute left-0 right-0 h-px bg-amber-400/60 shadow-[0_0_4px_#f59e0b]"></div>
                    {/* Eje Vertical */}
                    <div className="absolute top-0 bottom-0 w-px bg-amber-400/60 shadow-[0_0_4px_#f59e0b]"></div>
                    {/* Cruceta Central */}
                    <div className="w-8 h-8 rounded-full border border-amber-400/80 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    </div>
                  </div>
                )}

                {activeGuide === 'safe' && (
                  <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center p-[10%]">
                    <div className="w-full h-full border-2 border-dashed border-emerald-400/70 rounded bg-emerald-500/5 flex items-start justify-start p-1.5">
                      <span className="text-[9px] font-bold text-emerald-400 bg-black/70 px-1 rounded">
                        Área Segura (80%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Badge Informativo Flotante */}
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur border border-white/10 px-2 py-0.5 rounded text-[10px] text-white pointer-events-none z-20">
                  {targetW} × {targetH} &bull; {cropFit.toUpperCase()} {borderPadding > 0 ? `(${borderPadding}% Margen)` : ''}
                </div>
              </div>
            </div>

            {/* Selector de Presets de Formatos Rápidos */}
            <div>
              <span className="text-[11px] text-slate-400 font-bold block mb-1">
                Presets de Formato y Redes:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 text-[10px]">
                {[
                  { label: 'Google Ads (1200×628)', w: '1200', h: '628', defaultFit: 'cover' as const },
                  { label: 'Banner HD (16:9)', w: '1920', h: '1080', defaultFit: 'cover' as const },
                  { label: 'Cuadrado (1:1)', w: '1080', h: '1080', defaultFit: 'cover' as const },
                  { label: 'Historia (9:16)', w: '1080', h: '1920', defaultFit: 'contain' as const },
                  { label: 'Retrato (4:5)', w: '1080', h: '1350', defaultFit: 'cover' as const },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCustomWidth(preset.w);
                      setCustomHeight(preset.h);
                      setCropFit(preset.defaultFit);
                    }}
                    className={`p-1.5 rounded border text-center transition ${
                      customWidth === preset.w && customHeight === preset.h
                        ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold'
                        : 'bg-[#090b10] border-[#232730] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Controles de Centrado, Matriz 9-Puntos, Bordes y Grosor (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4 text-xs">
            
            {/* 1. Tratamiento de Imagen: Recortar vs Rellenar */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">1. Modo de Adaptación:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCropFit('cover')}
                  className={`py-2 px-2 rounded border text-center transition ${
                    cropFit === 'cover'
                      ? 'bg-[#e62429] border-[#e62429] text-white font-bold shadow-md shadow-[#e62429]/20'
                      : 'bg-[#090b10] border-[#232730] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Recortar (Cover)
                </button>
                <button
                  type="button"
                  onClick={() => setCropFit('contain')}
                  className={`py-2 px-2 rounded border text-center transition ${
                    cropFit === 'contain'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-md shadow-purple-600/20'
                      : 'bg-[#090b10] border-[#232730] text-slate-400 hover:border-slate-600'
                  }`}
                  title="Mantiene la imagen completa agregando márgenes o fondo desenfocado"
                >
                  Rellenar (Contain)
                </button>
              </div>
            </div>

            {/* 2. Matriz de 9 Puntos de Posicionamiento / Centrado Manual */}
            <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Alineación & Centrado:</span>
                </label>
                <span className="text-emerald-400 text-[10px] font-bold uppercase">
                  {cropPosition}
                </span>
              </div>

              {/* Matriz 3x3 */}
              <div className="grid grid-cols-3 gap-1.5 max-w-[200px] mx-auto py-1">
                {[
                  { pos: 'top-left' as const, icon: ArrowUpLeft, label: 'Arriba-Izq' },
                  { pos: 'top' as const, icon: ArrowUp, label: 'Arriba' },
                  { pos: 'top-right' as const, icon: ArrowUpRight, label: 'Arriba-Der' },
                  { pos: 'left' as const, icon: ArrowLeft, label: 'Izquierda' },
                  { pos: 'center' as const, icon: Circle, label: 'Centro' },
                  { pos: 'right' as const, icon: ArrowRight, label: 'Derecha' },
                  { pos: 'bottom-left' as const, icon: ArrowDownLeft, label: 'Abajo-Izq' },
                  { pos: 'bottom' as const, icon: ArrowDown, label: 'Abajo' },
                  { pos: 'bottom-right' as const, icon: ArrowDownRight, label: 'Abajo-Der' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = cropPosition === item.pos || (item.pos === 'top' && cropPosition === 'north') || (item.pos === 'bottom' && cropPosition === 'south');
                  return (
                    <button
                      key={item.pos}
                      type="button"
                      onClick={() => setCropPosition(item.pos)}
                      title={item.label}
                      className={`h-9 flex items-center justify-center rounded border transition ${
                        isSelected
                          ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-md shadow-[#2563eb]/40 font-bold'
                          : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Modos Smart IA */}
              <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCropPosition('entropy')}
                  className={`py-1 px-1.5 rounded border transition flex items-center justify-center gap-1 ${
                    cropPosition === 'entropy'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white'
                  }`}
                  title="Centra automáticamente en la zona con mayor detalle visual"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>IA Enfoque Detalle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCropPosition('attention')}
                  className={`py-1 px-1.5 rounded border transition flex items-center justify-center gap-1 ${
                    cropPosition === 'attention'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white'
                  }`}
                  title="Detecta personas o el sujeto principal automáticamente"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>IA Sujeto Principal</span>
                </button>
              </div>
            </div>

            {/* 3. Grosor de Bordes (Padding / Margen) */}
            <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Grosor de Borde (Margen):</span>
                </label>
                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {borderPadding}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">0%</span>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={borderPadding}
                  onChange={(e) => setBorderPadding && setBorderPadding(parseInt(e.target.value, 10))}
                  className="flex-1 h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[10px] text-slate-500 font-mono">35%</span>
              </div>

              {/* Pills de Grosor Rápido */}
              <div className="flex items-center gap-1 text-[10px]">
                {[0, 5, 10, 15, 20, 25].map((pad) => (
                  <button
                    key={pad}
                    type="button"
                    onClick={() => setBorderPadding && setBorderPadding(pad)}
                    className={`flex-1 py-0.5 rounded border transition ${
                      borderPadding === pad
                        ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                        : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white'
                    }`}
                  >
                    {pad === 0 ? 'Sin Borde' : `${pad}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Estilo y Color de Fondo de Bordes */}
            <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg space-y-2">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Estilo & Color de Borde:</span>
              </label>

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
                    className={`py-1.5 rounded border text-center transition ${
                      containBackground === bg.id
                        ? 'bg-purple-600 border-purple-400 text-white font-bold'
                        : 'bg-[#14161b] border-[#232730] text-slate-400 hover:text-white'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>

              {/* Selector de Color Personalizado Hex */}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-[10px] text-slate-400">Color Hex:</label>
                <div className="relative flex items-center gap-2 flex-1">
                  <input
                    type="color"
                    value={isCustomColor ? containBackground : customHexColor}
                    onChange={(e) => {
                      setCustomHexColor(e.target.value);
                      if (setContainBackground) setContainBackground(e.target.value);
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-[#232730] bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="#111522"
                    value={isCustomColor ? containBackground : customHexColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomHexColor(val);
                      if (setContainBackground && /^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                        setContainBackground(val);
                      }
                    }}
                    className="flex-1 bg-[#14161b] border border-[#232730] focus:border-[#2563eb] rounded px-2 py-1 text-white text-[11px] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#232730] font-mono text-xs">
          <div className="text-slate-400 text-[11px]">
            {borderPadding > 0 ? (
              <span className="text-emerald-400 font-bold">
                ✓ Se aplicará un margen de {borderPadding}% con fondo {containBackground}
              </span>
            ) : (
              <span>Modo full-bleed ({cropFit})</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="px-5 py-2 bg-[#e62429] hover:bg-[#ff3b30] text-white font-bold rounded flex items-center gap-1.5 shadow-md shadow-[#e62429]/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Crop className="w-4 h-4" />
              <span>{isApplying ? 'Procesando...' : 'Aplicar Encuadre & Recomprimir'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
