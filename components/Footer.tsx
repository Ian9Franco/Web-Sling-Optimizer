'use client';

import React from 'react';
import { Globe, Github, Sparkles, Disc, Radio, Flame, Zap, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  const marqueeItems = [
    { text: 'WEB-SLING OPTIMIZER PRO', icon: '⚡', color: 'text-amber-400 font-extrabold' },
    { text: 'SUPER-RESOLUCIÓN LANCZOS3 (2X & 4X HD)', icon: '🌟', color: 'text-yellow-300 font-bold' },
    { text: 'SOPORTE UNIVERSAL RAW (DNG, CR2, NEF, ARW, HEIC)', icon: '📷', color: 'text-cyan-400 font-bold' },
    { text: 'IA MULTIMODAL SEO (GEMINI 1.5 & OPENAI GPT-4O)', icon: '🤖', color: 'text-emerald-400 font-bold' },
    { text: 'COMPRESIÓN SHARP SIN PÉRDIDA & ULTRA REDUCCIÓN', icon: '🚀', color: 'text-purple-400' },
    { text: 'WEBP • AVIF • JPEG • PNG • TIFF • GIF', icon: '🌈', color: 'text-orange-400 font-bold' },
    { text: 'FAVICON SUITE (.ICO, .PNG, MANIFEST & OG CARDS)', icon: '📦', color: 'text-pink-400 font-semibold' },
    { text: 'GENERADOR DE CÓDIGO HTML5 <PICTURE> & SRCSET', icon: '💻', color: 'text-blue-400' },
    { text: 'LIMPIEZA DE METADATOS EXIF & GPS PRIVACY', icon: '🛡️', color: 'text-emerald-300' },
    { text: 'RECORTES PRESET PARA ADS, STORIES & BANNERS', icon: '📐', color: 'text-indigo-400' },
    { text: 'RENOMBRADO EN LOTE CON TOKENS DINÁMICOS & SLUGIFY', icon: '🏷️', color: 'text-teal-300 font-bold' },
    { text: 'SIN LÍMITE DE PESO CON PRE-PROCESAMIENTO CLIENTE', icon: '⚡', color: 'text-rose-400 font-bold' },
  ];

  return (
    <footer className="mt-16 bg-[#080a10] border-t border-[#1e2638] relative z-10 shadow-2xl overflow-hidden font-mono select-none">
      {/* 🌈 Rainbow Spectrum Wave Bar */}
      <div className="h-1.5 w-full bg-retro-rainbow shadow-[0_0_12px_rgba(255,100,50,0.6)]" />

      {/* 📼 Infinite Animated Marquee Strip */}
      <div className="bg-[#05060a] border-b border-[#182030] py-2.5 overflow-hidden flex items-center relative">
        {/* Left/Right Vignette gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#05060a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#05060a] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-infinite flex items-center gap-8 text-[11px] whitespace-nowrap">
          {/* Primer set */}
          {marqueeItems.map((item, idx) => (
            <div key={`m1-${idx}`} className="flex items-center gap-2">
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className={`${item.color} uppercase tracking-wider drop-shadow-sm`}>
                {item.text}
              </span>
              <span className="text-slate-600 ml-3">◆</span>
            </div>
          ))}

          {/* Segundo set duplicado para loop infinito perfecto */}
          {marqueeItems.map((item, idx) => (
            <div key={`m2-${idx}`} className="flex items-center gap-2">
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className={`${item.color} uppercase tracking-wider drop-shadow-sm`}>
                {item.text}
              </span>
              <span className="text-slate-600 ml-3">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#141a29] text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            v2.0 PRO
          </span>
          <p className="text-[11px] text-slate-300">
            Desarrollado por <span className="text-white font-bold tracking-wide">Ian Pontorno</span> &bull; Web-Sling Optimizer Suite
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <a 
            href="https://ian-pontorno-portfolio.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#101524] text-slate-300 hover:text-white border border-[#202b42] hover:border-[#2563eb] transition shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Portafolio</span>
          </a>
          <a 
            href="https://github.com/Ian9Franco" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#101524] text-slate-300 hover:text-white border border-[#202b42] hover:border-emerald-500 transition shadow-sm"
          >
            <Github className="w-3.5 h-3.5 text-emerald-400" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

