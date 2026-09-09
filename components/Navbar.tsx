'use client';

import React from 'react';
import { Package, Bot, Zap, Sparkles, Cpu } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface NavbarProps {
  onOpenFaviconModal: () => void;
  onOpenAIModal: () => void;
  isAIConfigured: boolean;
  hasImages: boolean;
  totalSavedBytes: number;
  overallSavedPercent: string;
  formatBytes: (bytes: number) => string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFaviconModal,
  onOpenAIModal,
  isAIConfigured,
  hasImages,
  totalSavedBytes,
  overallSavedPercent,
  formatBytes,
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-[#07090e]/85 backdrop-blur-xl border-b border-[#1b2234]/80 shadow-[0_4px_30px_rgba(0,0,0,0.7)] relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#e62429]/50 before:to-transparent">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#e62429] to-[#2563eb] rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-500" />
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#e62429]/50 shadow-[0_0_15px_rgba(230,36,41,0.3)] bg-[#0e121e] flex items-center justify-center p-1.5 relative transition-all duration-300 group-hover:scale-105">
              <img 
                src="/websling_logo.png" 
                alt="Web-Sling Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(230,36,41,0.6)]" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm sm:text-base tracking-wider font-extrabold text-white uppercase">
                Web-Sling
              </span>
              <span className="font-mono text-sm sm:text-base tracking-wider font-black uppercase bg-gradient-to-r from-[#ff383e] via-[#e62429] to-[#ff4757] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(230,36,41,0.5)]">
                Optimizer
              </span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono bg-[#111728]/90 text-cyan-300 border border-cyan-500/25 rounded-full shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>v1.5 &bull; con IA Vision</span>
            </div>
          </div>
        </div>

        {/* Acciones & Status */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          
          {/* Botón IA Vision SEO */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenAIModal}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border font-medium ${
                isAIConfigured 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-[#101422] border-[#22293a] text-slate-300 hover:border-[#2563eb] hover:text-white hover:bg-[#141b30]'
              }`}
              title="Configuración de IA (Google Gemini / OpenAI)"
            >
              <Bot className={`w-4 h-4 ${isAIConfigured ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">IA SEO</span>
              {isAIConfigured ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">(Activar)</span>
              )}
            </button>
            <InfoTooltip
              title="Módulo de IA Vision SEO"
              description="Conecta tu API Key de Google Gemini o OpenAI para que un modelo de visión analice visualmente cada imagen y genere nombres de archivo semánticos y textos ALT optimizados para accesibilidad y Google Images."
              placement="bottom"
            />
          </div>

          {/* Botón Favicon Generator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenFaviconModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-medium transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_22px_rgba(37,99,235,0.45)] border border-blue-400/20 active:scale-95"
            >
              <Package className="w-4 h-4 text-blue-200" />
              <span className="hidden sm:inline">Favicon Generator</span>
              <span className="sm:hidden">Favicon</span>
            </button>
            <InfoTooltip
              title="Generador de Favicon Multi-plataforma"
              description="Convierte cualquier imagen o logo en un paquete completo de favicons: favicon.ico multi-resolución (16x16, 32x32, 48x48), PNGs para Apple Touch Icon, Android Chrome PWA (192x192, 512x512) y el archivo manifest.json listo para copiar."
              placement="bottom"
            />
          </div>

          {/* Badge de Ahorro en Vivo */}
          {hasImages && (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              {totalSavedBytes >= 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30 animate-pulse" />
                  <span className="hidden md:inline text-slate-400 font-normal">Ahorro:</span>
                  <span>{formatBytes(totalSavedBytes)}</span>
                  <span className="text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded text-[10px]">
                    -{overallSavedPercent}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <span className="text-slate-400 font-normal hidden md:inline">Diff:</span>
                  <span>+{formatBytes(Math.abs(totalSavedBytes))}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
