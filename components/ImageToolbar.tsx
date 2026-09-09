'use client';

import React from 'react';
import { 
  Download, 
  Trash2, 
  RotateCw, 
  LayoutGrid, 
  List,
  Bot
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface ImageToolbarProps {
  count: number;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onReprocess: () => void;
  onClear: () => void;
  onDownloadZip: () => void;
  isZipping: boolean;
  hasDoneImages: boolean;
  onBatchAI?: () => void;
  isAnalyzingAI?: boolean;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  count,
  viewMode,
  onViewModeChange,
  onReprocess,
  onClear,
  onDownloadZip,
  isZipping,
  hasDoneImages,
  onBatchAI,
  isAnalyzingAI,
}) => {
  return (
    <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 p-3 panel-border">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs uppercase text-slate-400 font-bold">
            Archivos ({count})
          </span>
          <InfoTooltip
            title="Cola de Imágenes"
            description="Lista de imágenes cargadas listas para compresión, reescalado, renombrado SEO y extracción de metadatos C2PA."
          />
        </div>
        <div className="flex bg-[#0c0d10] border border-[#232730] rounded p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1 rounded text-xs transition ${viewMode === 'table' ? 'bg-[#2563eb] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Vista Tabla"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1 rounded text-xs transition ${viewMode === 'grid' ? 'bg-[#2563eb] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            title="Vista Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onBatchAI && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onBatchAI}
              disabled={isAnalyzingAI || count === 0}
              className="flex items-center gap-1.5 text-xs font-mono text-emerald-300 hover:text-white px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 transition disabled:opacity-40"
              title="Analizar todo el lote con IA para generar Nombres SEO y Texto ALT"
            >
              <Bot className={`w-3.5 h-3.5 text-emerald-400 ${isAnalyzingAI ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingAI ? 'Analizando...' : 'Auto SEO'}</span>
            </button>
            <InfoTooltip
              title="Auto SEO en Lote con IA"
              description="Analiza visualmente todas las imágenes del lote en paralelo usando el modelo de visión seleccionado para asignarles automáticamente un nombre semántico (kebab-case) y un texto ALT descriptivo optimizado para SEO."
              placement="bottom"
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReprocess}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-2.5 py-1.5 rounded bg-[#14161b] border border-[#232730] hover:border-[#2563eb] transition"
            title="Re-aplicar compresión y filtros a todo el lote"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="hidden sm:inline">Re-aplicar Ajustes</span>
            <span className="sm:hidden">Re-aplicar</span>
          </button>
          <InfoTooltip
            title="Reprocesar Lote Completo"
            description="Aplica los parámetros actuales del panel lateral (calidad, formato, dimensiones, filtros de nitidez, marca de agua) a todas las imágenes cargadas."
            placement="bottom"
          />
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded bg-[#14161b] border border-[#232730] transition"
          title="Limpiar lista completa"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Limpiar</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isZipping || !hasDoneImages}
            className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#e62429] hover:bg-[#ff3b30] text-white px-3 sm:px-4 py-1.5 rounded transition shadow-md shadow-[#e62429]/30 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Empaquetando...' : 'ZIP (.ZIP)'}</span>
          </button>
          <InfoTooltip
            title="Descarga en Lote ZIP"
            description="Empaqueta todas las imágenes optimizadas en un archivo comprimido .zip listo para descargar directamente a tu equipo."
            placement="bottom"
          />
        </div>
      </div>
    </div>
  );
};
