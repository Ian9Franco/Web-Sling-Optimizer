'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
    <nav className="sticky top-0 z-40 bg-[#06080d]/85 backdrop-blur-2xl border-b border-[#1f283d] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.92),0_4px_16px_rgba(0,0,0,0.7)] relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-[#2563eb]/50 after:via-[#e62429]/50 after:to-transparent">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Branding con Motion Animation */}
        <div className="flex items-center gap-3.5">
          <motion.div 
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {/* Resplandor ambiental animado */}
            <motion.div 
              className="absolute -inset-1.5 bg-gradient-to-r from-[#e62429] via-[#ff383e] to-[#2563eb] rounded-2xl blur-md opacity-30 group-hover:opacity-75"
              animate={{ 
                opacity: [0.25, 0.55, 0.25],
                scale: [0.95, 1.08, 0.95],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Contenedor del Icono con animación de flotación y rotación sutil */}
            <motion.div 
              className="w-11 h-11 rounded-xl overflow-hidden border border-[#e62429]/60 shadow-[0_0_20px_rgba(230,36,41,0.45)] bg-[#0c101c] flex items-center justify-center p-1 relative"
              animate={{
                y: [0, -2, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              whileHover={{
                rotate: [0, -6, 6, -3, 0],
                transition: { duration: 0.5 }
              }}
            >
              <motion.img 
                src="/websling_logo.png" 
                alt="Web-Sling Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(230,36,41,0.8)]" 
                animate={{
                  scale: [1, 1.06, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
          </motion.div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5">
            <motion.div 
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="font-mono text-sm sm:text-base tracking-wider font-extrabold text-white uppercase">
                Web-Sling
              </span>
              <span className="font-mono text-sm sm:text-base tracking-wider font-black uppercase bg-gradient-to-r from-[#ff383e] via-[#e62429] to-[#ff4757] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(230,36,41,0.5)]">
                Optimizer
              </span>
            </motion.div>

            <motion.div 
              className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono bg-[#111728]/90 text-cyan-300 border border-cyan-500/25 rounded-full shadow-inner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <span>v2.0 &bull; ahora si, con IA</span>
            </motion.div>
          </div>
        </div>

        {/* Acciones & Status con Motion Animations */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          
          {/* Botón IA Vision SEO */}
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={onOpenAIModal}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors border font-medium ${
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
            </motion.button>
            <InfoTooltip
              title="Módulo de IA Vision SEO"
              description="Conecta tu API Key de Google Gemini o OpenAI para que un modelo de visión analice visualmente cada imagen y genere nombres de archivo semánticos y textos ALT optimizados para accesibilidad y Google Images."
              placement="bottom"
            />
          </div>

          {/* Botón Favicon Generator */}
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={onOpenFaviconModal}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_22px_rgba(37,99,235,0.45)] border border-blue-400/20"
            >
              <Package className="w-4 h-4 text-blue-200" />
              <span className="hidden sm:inline">Favicon Generator</span>
              <span className="sm:hidden">Favicon</span>
            </motion.button>
            <InfoTooltip
              title="Generador de Favicon Multi-plataforma"
              description="Convierte cualquier imagen o logo en un paquete completo de favicons: favicon.ico multi-resolución (16x16, 32x32, 48x48), PNGs para Apple Touch Icon, Android Chrome PWA (192x192, 512x512) y el archivo manifest.json listo para copiar."
              placement="bottom"
            />
          </div>

          {/* Badge de Ahorro en Vivo */}
          {hasImages && (
            <motion.div 
              className="cursor-default"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {totalSavedBytes >= 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-colors">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30 animate-pulse" />
                  <span className="hidden md:inline text-slate-400 font-normal">Ahorro:</span>
                  <span>{formatBytes(totalSavedBytes)}</span>
                  <span className="text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded text-[10px]">
                    -{overallSavedPercent}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400/60 transition-colors">
                  <span className="text-slate-400 font-normal hidden md:inline">Diff:</span>
                  <span>+{formatBytes(Math.abs(totalSavedBytes))}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
};
