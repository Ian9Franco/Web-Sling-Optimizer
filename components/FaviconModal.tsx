'use client';

import React, { useRef } from 'react';
import { Package, X, Image as ImageIcon, Check, Download } from 'lucide-react';

interface FaviconModalProps {
  isOpen: boolean;
  onClose: () => void;
  faviconCustomName: string;
  setFaviconCustomName: (val: string) => void;
  faviconFile: File | null;
  faviconResults: any | null;
  setFaviconResults: React.Dispatch<React.SetStateAction<any | null>>;
  isGeneratingFavicons: boolean;
  handleFaviconProcess: (file: File) => Promise<void>;
  downloadFaviconZip: () => Promise<void>;
}

export const FaviconModal: React.FC<FaviconModalProps> = ({
  isOpen,
  onClose,
  faviconCustomName,
  setFaviconCustomName,
  faviconFile,
  faviconResults,
  setFaviconResults,
  isGeneratingFavicons,
  handleFaviconProcess,
  downloadFaviconZip,
}) => {
  const faviconInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="panel-border bg-[#111522] max-w-xl w-full p-6 relative font-mono">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-[#e62429]" />
          <h3 className="text-base font-bold text-white uppercase">Generador de Paquete de Favicons</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Sube tu logotipo y genera automáticamente un paquete listo para la web (`favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`).
        </p>

        <div className="mb-4">
          <label className="text-[10px] text-slate-400 block mb-1">Nombre / Prefijo del Favicon:</label>
          <input
            type="text"
            placeholder="Ej. favicon o mi_icono"
            value={faviconCustomName}
            onChange={(e) => setFaviconCustomName(e.target.value)}
            className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
          />
        </div>

        <div 
          onClick={() => faviconInputRef.current?.click()}
          className="panel-border p-6 text-center cursor-pointer border-dashed border-[#232730] hover:border-[#2563eb] bg-[#090b10] mb-6"
        >
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFaviconProcess(e.target.files[0])}
          />
          <ImageIcon className="w-8 h-8 text-[#2563eb] mx-auto mb-2" />
          <span className="text-xs font-bold text-white block">
            {faviconFile ? faviconFile.name : 'Seleccionar Logo / Imagen'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Recomendado imagen cuadrada PNG/SVG alta resolución</span>
        </div>

        {isGeneratingFavicons && (
          <div className="text-center text-xs text-[#2563eb] animate-pulse mb-4">
            Generando variantes de favicon y site.webmanifest...
          </div>
        )}

        {faviconResults && (
          <div className="space-y-4">
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>¡Paquete de 6 iconos + site.webmanifest generado!</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px] text-slate-400">
              {faviconResults.icons.map((ic: any, idx: number) => (
                <div key={idx} className="bg-[#090b10] p-2 rounded border border-[#232730] flex flex-col items-center">
                  <img src={`data:image/png;base64,${ic.base64}`} alt={ic.name} className="w-8 h-8 mb-1 object-contain" />
                  <input 
                    type="text" 
                    value={ic.name} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFaviconResults((prev: any) => ({
                        ...prev,
                        icons: prev.icons.map((item: any, i: number) => i === idx ? { ...item, name: val } : item)
                      }));
                    }}
                    className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-[9px] font-mono text-center text-slate-200 rounded px-1 py-0.5 outline-none truncate"
                    title="Haz clic para renombrar este archivo"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5">{ic.size}x{ic.size}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={downloadFaviconZip}
              className="w-full py-2.5 bg-[#e62429] text-white font-bold text-xs rounded hover:bg-[#ff3b30] transition shadow-md shadow-[#e62429]/30 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>DESCARGAR PAQUETE FAVICONS (.ZIP)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
