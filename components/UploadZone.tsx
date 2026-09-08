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
          ? 'border-[#e62429] bg-[#1a1215] scale-[1.005]' 
          : 'border-[#1e2638] hover:border-[#2563eb]/60 bg-[#111522]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.tiff,.tif,.bmp,.dng,.raw,.cr2,.nef"
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
        Soporta JPG, PNG, WebP, AVIF, RAW / DNG, TIFF &bull; Sin límite de peso (Pre-optimización inteligente)
      </p>
    </div>
  );
};
