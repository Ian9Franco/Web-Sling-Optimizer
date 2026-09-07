'use client';

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`panel-border p-8 text-center cursor-pointer transition-all duration-200 border-dashed ${
        isDragging 
          ? 'border-[#e62429] bg-[#e62429]/10 scale-[1.005]' 
          : 'border-[#232730] hover:border-[#2563eb]/60 bg-[#14161b]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.tiff,.bmp"
        className="hidden"
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
      />

      <div className="w-12 h-12 rounded-xl bg-[#0c0d10] border border-[#232730] text-[#e62429] flex items-center justify-center mx-auto mb-3">
        <Upload className="w-6 h-6" />
      </div>

      <h3 className="font-mono text-sm font-bold text-white mb-1">
        SOLTAR IMÁGENES ACÁ O PEGAR (CTRL + V)
      </h3>
      <p className="text-slate-500 text-xs font-mono">
        Soporta JPG, PNG, WebP, AVIF, TIFF, BMP &bull; Máx. 4.5 MB por archivo (Optimizado para Vercel)
      </p>
    </div>
  );
};
