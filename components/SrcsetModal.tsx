'use client';

import React, { useState } from 'react';
import { X, Code, Copy, Check, FileCode, Layers } from 'lucide-react';
import { ProcessedImage } from '../types/image';

interface SrcsetModalProps {
  image: ProcessedImage | null;
  onClose: () => void;
}

export const SrcsetModal: React.FC<SrcsetModalProps> = ({ image, onClose }) => {
  const [codeType, setCodeType] = useState<'html' | 'jsx'>('html');
  const [copied, setCopied] = useState(false);

  if (!image) return null;

  const fileName = image.outputFileName;
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
  const ext = dotIndex !== -1 ? fileName.substring(dotIndex + 1).toLowerCase() : 'webp';
  const width = image.finalWidth || 1200;
  const height = image.finalHeight || 800;

  const altText = image.altText || baseName;

  const htmlCode = `<picture>
  <!-- Soporte de última generación (AVIF) -->
  <source 
    type="image/avif" 
    srcset="${baseName}-400.avif 400w, ${baseName}-800.avif 800w, ${baseName}.avif ${width}w" 
    sizes="(max-width: 768px) 100vw, ${width}px"
  >
  <!-- Soporte WebP estándar -->
  <source 
    type="image/webp" 
    srcset="${baseName}-400.webp 400w, ${baseName}-800.webp 800w, ${baseName}.webp ${width}w" 
    sizes="(max-width: 768px) 100vw, ${width}px"
  >
  <!-- Imagen fallback con atributos SEO y Lazy-loading -->
  <img 
    src="${baseName}.${ext}" 
    alt="${altText}" 
    width="${width}" 
    height="${height}" 
    loading="lazy" 
    decoding="async"
  >
</picture>`;

  const jsxCode = `<picture>
  {/* Soporte de última generación (AVIF) */}
  <source 
    type="image/avif" 
    srcSet="${baseName}-400.avif 400w, ${baseName}-800.avif 800w, ${baseName}.avif ${width}w" 
    sizes="(max-width: 768px) 100vw, ${width}px"
  />
  {/* Soporte WebP estándar */}
  <source 
    type="image/webp" 
    srcSet="${baseName}-400.webp 400w, ${baseName}-800.webp 800w, ${baseName}.webp ${width}w" 
    sizes="(max-width: 768px) 100vw, ${width}px"
  />
  {/* Imagen fallback con atributos SEO y Lazy-loading */}
  <img 
    src="/${baseName}.${ext}" 
    alt="${altText}" 
    width={${width}} 
    height={${height}} 
    loading="lazy" 
    decoding="async"
  />
</picture>`;

  const currentCode = codeType === 'html' ? htmlCode : jsxCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="panel-border bg-[#111522] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative font-mono text-xs">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <FileCode className="w-5 h-5 text-[#2563eb]" />
          <h3 className="text-base font-bold text-white uppercase">Generador de &lt;picture&gt; &amp; srcset</h3>
        </div>
        <p className="text-slate-400 text-xs mb-4">
          Snippet responsive optimizado para SEO, Core Web Vitals y compatibilidad multi-formato.
        </p>

        {/* Info y Toggle HTML / JSX */}
        <div className="flex items-center justify-between mb-3 bg-[#090b10] p-2.5 rounded border border-[#232730]">
          <div className="text-slate-300">
            Archivo: <span className="text-white font-bold">{fileName}</span> &bull; {width}×{height}px
          </div>

          <div className="flex bg-[#14161b] border border-[#232730] rounded p-0.5">
            <button
              type="button"
              onClick={() => setCodeType('html')}
              className={`px-2.5 py-1 rounded transition ${
                codeType === 'html' ? 'bg-[#2563eb] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setCodeType('jsx')}
              className={`px-2.5 py-1 rounded transition ${
                codeType === 'jsx' ? 'bg-[#2563eb] text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSX (React / Next.js)
            </button>
          </div>
        </div>

        {/* Bloque de Código */}
        <div className="relative mb-4">
          <pre className="p-4 bg-[#090b10] rounded-lg border border-[#232730] text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-64 select-all">
            <code>{currentCode}</code>
          </pre>

          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded font-bold shadow-md transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar Código'}</span>
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#090b10] border border-[#232730] text-slate-300 rounded hover:border-slate-600 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
