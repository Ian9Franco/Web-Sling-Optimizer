'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ShieldCheck,
  Sliders,
  Zap,
  Maximize2,
  Sparkles,
  FileImage,
  RotateCw,
  Shield,
} from 'lucide-react';

interface CompressionInfoPanelProps {
  qualityMode: 'preserve' | 'manual' | 'maxKB';
  quality: number;
  maxKB: number;
  resizeMode: 'none' | 'custom';
  customWidth: string;
  customHeight: string;
  upscaleFactor: 1 | 2 | 4;
  clarity: boolean;
  format: string;
  stripExif: boolean;
  cropFit: string;
}

interface InfoSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  details: string[];
  active?: boolean;
}

export const CompressionInfoPanel: React.FC<CompressionInfoPanelProps> = ({
  qualityMode,
  quality,
  maxKB,
  resizeMode,
  customWidth,
  customHeight,
  upscaleFactor,
  clarity,
  format,
  stripExif,
  cropFit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const qualityLabel =
    qualityMode === 'preserve'
      ? 'Sin Pérdida — conserva la nitidez original'
      : qualityMode === 'manual'
        ? `Calidad fija al ${quality}%`
        : `Límite KB — objetivo máximo ${maxKB} KB`;

  const resizeLabel =
    resizeMode === 'custom' && (customWidth || customHeight)
      ? `Redimensionado a ${customWidth || 'auto'} × ${customHeight || 'auto'} px (${cropFit})`
      : upscaleFactor > 1
        ? `Super-Resolución ${upscaleFactor}x con Lanczos3`
        : 'Sin cambio de dimensiones';

  const sections: InfoSection[] = [
    {
      id: 'pipeline',
      icon: <Layers className="w-3.5 h-3.5 text-[#2563eb]" />,
      title: 'Pipeline de 2 etapas',
      summary: 'Cada imagen pasa por transformaciones visuales y luego codificación de compresión.',
      active: true,
      details: [
        'Etapa 1 — Transformaciones: redimensionado, rotación, recorte, upscaling, Claridad HD, marca de agua y conversión de formato. Se ejecuta una sola vez con Sharp.',
        'Etapa 2 — Codificación: aplica el modo de calidad elegido (sin pérdida, % fijo o límite KB) sobre el buffer ya transformado.',
        'Salvaguarda: si el resultado pesa más que el original sin transformaciones visuales, se devuelve el archivo original intacto.',
      ],
    },
    {
      id: 'quality',
      icon: <Sliders className="w-3.5 h-3.5 text-emerald-400" />,
      title: 'Modos de calidad',
      summary: qualityLabel,
      active: true,
      details: [
        'Sin Pérdida: no reduce calidad destructivamente. Si no hay cambios visuales ni formato, devuelve el original. Con transformaciones, codifica al ~95%.',
        'Calidad %: codifica con el porcentaje exacto que elijas (WebP, AVIF, JPEG con mozjpeg, PNG con palette si <100%).',
        'Límite KB: bucle iterativo — empieza en 90% y baja de 5 en 5 hasta alcanzar el peso objetivo o mínimo 15%. Si PNG no alcanza, convierte a JPG automáticamente.',
      ],
    },
    {
      id: 'resize',
      icon: <Maximize2 className="w-3.5 h-3.5 text-amber-400" />,
      title: 'Redimensionado & recorte',
      summary: resizeLabel,
      active: resizeMode === 'custom' || upscaleFactor > 1,
      details: [
        'Inside: encaja la imagen dentro del marco sin recortar (sin agrandar).',
        'Cover: llena el marco recortando los bordes según la posición elegida.',
        'Contain: añade relleno (blur cinematográfico, color sólido o transparente) con marco configurable.',
        'Kernel Lanczos3: interpolación de alta fidelidad para redimensionado y upscaling 2x/4x.',
      ],
    },
    {
      id: 'clarity',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      title: 'Claridad HD',
      summary: clarity
        ? 'Activo — sharpen + reducción de ruido sutil'
        : 'Desactivado',
      active: clarity,
      details: [
        'Aplica unsharp masking (sigma 1.2) para recuperar nitidez tras compresión agresiva.',
        'Median filter (radio 1) reduce ruido de compresión sin perder detalle perceptible.',
        'Recomendado cuando usas Límite KB bajo (<150 KB) en imágenes con texto o bordes finos.',
      ],
    },
    {
      id: 'formats',
      icon: <FileImage className="w-3.5 h-3.5 text-cyan-400" />,
      title: 'Formatos de salida',
      summary: format === 'original' ? 'Conserva formato original' : `Conversión a ${format.toUpperCase()}`,
      active: format !== 'original',
      details: [
        'WebP / AVIF: máxima compresión con calidad visual (recomendado para web).',
        'JPEG (mozjpeg): compatibilidad universal, chroma 4:2:0 para menor peso.',
        'PNG: sin pérdida, ideal para transparencias. Puede aumentar peso vs JPG.',
        'RAW (DNG, CR2, NEF…): se extrae la vista previa JPEG interna y exporta a JPG limpio.',
      ],
    },
    {
      id: 'precompress',
      icon: <Cpu className="w-3.5 h-3.5 text-rose-400" />,
      title: 'Pre-compresión en navegador',
      summary: 'Archivos >4.1 MB se adaptan antes de subir al servidor',
      active: false,
      details: [
        'El límite serverless es 4.5 MB. Antes del envío, el cliente reduce imágenes grandes vía Canvas (máx. 4096 px).',
        'Si sigue siendo pesado, re-codifica a JPEG progresivamente hasta entrar en el umbral seguro.',
        'En la tabla verás el badge "Auto-adaptado (>4.5MB)" cuando esto ocurre.',
      ],
    },
    {
      id: 'security',
      icon: <Shield className="w-3.5 h-3.5 text-slate-400" />,
      title: 'Privacidad & metadatos',
      summary: stripExif ? 'EXIF eliminado por defecto' : 'EXIF conservado',
      active: stripExif,
      details: [
        'EXIF strip: elimina GPS, cámara, fecha y datos personales embebidos en la imagen.',
        'Marca de agua: texto SVG semitransparente compuesto en esquina inferior derecha.',
        'Rotación / volteo / escala de grises: transformaciones geométricas aplicadas antes de codificar.',
      ],
    },
  ];

  return (
    <div className="panel-border overflow-visible">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#14161b]/50 transition rounded-[inherit]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/30 flex-shrink-0">
            <Cpu className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">
              ¿Cómo funciona la optimización?
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed truncate sm:whitespace-normal">
              Pipeline, modos de compresión y qué hace cada función activa
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#232730]/80">
          {/* Resumen de configuración activa */}
          <div className="mt-3 p-3 rounded-lg bg-[#0c0d10] border border-[#2563eb]/20 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#2563eb] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              <span>Configuración activa ahora</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{qualityLabel}</span>
              </li>
              <li className="flex items-start gap-2">
                <Maximize2 className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{resizeLabel}</span>
              </li>
              <li className="flex items-start gap-2">
                <FileImage className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>
                  Formato: {format === 'original' ? 'Original (sin conversión)' : format.toUpperCase()}
                </span>
              </li>
              {clarity && (
                <li className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Claridad HD activa</span>
                </li>
              )}
              {stripExif && (
                <li className="flex items-start gap-2">
                  <RotateCw className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>Metadatos EXIF eliminados</span>
                </li>
              )}
            </ul>
          </div>

          {/* Secciones detalladas */}
          <div className="space-y-2">
            {sections.map((section) => (
              <details
                key={section.id}
                className="group rounded-lg border border-[#232730] bg-[#0c0d10]/60 overflow-hidden"
                open={section.active}
              >
                <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer list-none hover:bg-[#14161b]/60 transition select-none">
                  {section.icon}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-mono font-bold text-white block leading-tight">
                      {section.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-relaxed mt-0.5">
                      {section.summary}
                    </span>
                  </div>
                  {section.active && (
                    <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded flex-shrink-0">
                      Activo
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <ul className="px-3 pb-3 space-y-1.5 border-t border-[#232730]/60">
                  {section.details.map((detail, i) => (
                    <li
                      key={i}
                      className="text-[10.5px] text-slate-400 leading-relaxed pl-3 border-l border-[#232730] ml-1.5 pt-1.5 first:pt-2"
                    >
                      {detail}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
