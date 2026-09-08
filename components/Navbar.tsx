'use client';

import React from 'react';
import { Package, Bot } from 'lucide-react';

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
    <nav className="border-b border-[#1e2638] bg-[#090b10] shadow-lg shadow-black/60 sticky top-0 z-40">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Badge - High Visibility */}
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#e62429]/60 shadow-lg shadow-[#e62429]/30 bg-[#121624] flex items-center justify-center p-1 relative group hover:border-[#e62429] transition">
            <img 
              src="/websling_logo.png" 
              alt="Web-Sling Logo" 
              className="w-full h-full object-contain filter drop-shadow-[0_0_4px_rgba(230,36,41,0.5)]" 
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tracking-wide font-bold text-white uppercase">
              Web-Sling <span className="text-[#e62429] drop-shadow-[0_0_8px_rgba(230,36,41,0.4)]">Optimizer</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-[#141a29] text-cyan-300 border border-[#202c44] rounded">
              v1.5 &bull; ahora si, con IA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <button
            type="button"
            onClick={onOpenAIModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition border ${
              isAIConfigured 
                ? 'bg-[#111522] border-emerald-500/40 text-emerald-300 hover:border-emerald-500 hover:text-white' 
                : 'bg-[#111522] border-[#232730] text-slate-300 hover:border-[#2563eb] hover:text-white'
            }`}
            title="Configuración de IA (Google Gemini / OpenAI)"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>IA SEO</span>
            {isAIConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="IA Configurada y lista" />
            ) : (
              <span className="text-[10px] text-slate-500 font-normal">(Configurar)</span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFaviconModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2563eb] text-white hover:bg-[#3b82f6] transition shadow-md shadow-[#2563eb]/20"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Favicon Generator</span>
          </button>

          {hasImages && (
            totalSavedBytes >= 0 ? (
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                Ahorrado: {formatBytes(totalSavedBytes)} ({overallSavedPercent}%)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                Diferencia: +{formatBytes(Math.abs(totalSavedBytes))}
              </span>
            )
          )}
        </div>
      </div>
    </nav>
  );
};
