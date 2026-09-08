'use client';

import React from 'react';
import { Upload } from 'lucide-react';

interface GlobalDropOverlayProps {
  isDragging: boolean;
}

export const GlobalDropOverlay: React.FC<GlobalDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10]/95 backdrop-blur-md border-4 border-dashed border-[#e62429] flex flex-col items-center justify-center text-white pointer-events-none animate-pulse">
      <Upload className="w-16 h-16 text-[#e62429] mb-4 animate-bounce" />
      <h2 className="text-2xl font-mono font-bold uppercase mb-2">
        ¡SOLTAR ARCHIVOS, CARPETAS O ZIP ACÁ!
      </h2>
      <p className="text-sm font-mono text-slate-400">
        Escanearemos y procesaremos todas las imágenes encontradas automáticamente
      </p>
    </div>
  );
};
