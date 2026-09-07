'use client';

import React from 'react';
import { Package } from 'lucide-react';

interface NavbarProps {
  onOpenFaviconModal: () => void;
  hasImages: boolean;
  totalSavedBytes: number;
  overallSavedPercent: string;
  formatBytes: (bytes: number) => string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFaviconModal,
  hasImages,
  totalSavedBytes,
  overallSavedPercent,
  formatBytes,
}) => {
  return (
    <nav className="border-b border-[#232730] bg-[#090b10]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#232730] shadow-md shadow-[#e62429]/30 bg-[#090b10] flex items-center justify-center p-0.5">
            <img src="/apple-touch-icon.png" alt="Web-Sling Logo" className="w-full h-full object-contain rounded" />
          </div>
          <span className="font-mono text-sm tracking-wide font-bold text-white uppercase">
            Web-Sling <span className="text-[#e62429]">Optimizer</span>
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            v1.2 &bull; COMPRESIÓN + EDITORIAL + FAVICONS
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={onOpenFaviconModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2563eb] text-white hover:bg-[#3b82f6] transition shadow-md shadow-[#2563eb]/20"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Favicon Generator</span>
          </button>

          {hasImages && (
            <span className="text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
              Ahorrado: {formatBytes(totalSavedBytes)} ({overallSavedPercent}%)
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};
