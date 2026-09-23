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
  Lightbulb,
  Eye,
  Package,
  ImageIcon,
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

interface DidacticBlock {
  id: string;
  icon: React.ReactNode;
  title: string;
  text: string;
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
  const [showTechnical, setShowTechnical] = useState(false);

  const qualityLabel =
    qualityMode === 'preserve'
      ? 'Sin Pérdida — conserva la nitidez visual'
      : qualityMode === 'manual'
        ? `Calidad fija al ${quality}%`
        : `Límite KB — objetivo máximo ${maxKB} KB`;

  const qualityLabelSimple =
    qualityMode === 'preserve'
      ? 'Modo Sin Pérdida: prioriza que se vea igual que la original'
      : qualityMode === 'manual'
        ? `Comprime al ${quality}% de calidad (tú eliges el equilibrio)`
        : `Reduce el peso hasta un máximo de ${maxKB} KB automáticamente`;

  const resizeLabel =
    resizeMode === 'custom' && (customWidth || customHeight)
      ? `Redimensionado a ${customWidth || 'auto'} × ${customHeight || 'auto'} px`
      : upscaleFactor > 1
        ? `Super-Resolución ${upscaleFactor}x (más píxeles, más nitidez)`
        : 'Misma resolución que la original';

  const didacticBlocks: DidacticBlock[] = [
    {
      id: 'key-idea',
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
      title: 'La idea clave',
      text: 'El peso del archivo (MB/KB) no es lo mismo que la calidad visual. Dos fotos idénticas a simple vista pueden pesar muy distinto según cómo estén guardadas por dentro.',
    },
    {
      id: 'same-resolution',
      icon: <ImageIcon className="w-3.5 h-3.5 text-[#2563eb]" />,
      title: 'Misma resolución, distinto peso',
      text: 'Resolución = cuántos píxeles tiene (ej. 4000×3000). Peso = cuánto ocupa en disco. Puedes tener 4000×3000 px a 3 MB o a 400 KB. Mismo tamaño en pantalla, distinto empaquetado.',
    },
    {
      id: 'envelope',
      icon: <Package className="w-3.5 h-3.5 text-emerald-400" />,
      title: 'La analogía del sobre',
      text: 'La original es como una foto en un sobre gordo con manual de cámara, GPS y papeles extra. La optimizada es la misma foto en un sobre limpio. La imagen se ve igual; lo que sobra no se ve al hacer zoom.',
    },
    {
      id: 'what-we-remove',
      icon: <Shield className="w-3.5 h-3.5 text-purple-400" />,
      title: 'Qué quitamos sin que lo notes',
      text: 'Datos invisibles (ubicación, cámara, prompts de IA en PNG), detalle microscópico que el ojo no distingue, y empaquetado ineficiente de cámaras o exportaciones a calidad 100%.',
    },
    {
      id: 'why-zoom',
      icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />,
      title: '¿Por qué al hacer zoom casi no se nota?',
      text: 'El zoom en pantalla no es un microscopio. En fotos normales (retratos, paisajes) el ojo no detecta cambios mínimos de color. Sí se nota más en texto pequeño, logos o fondos lisos (cielo uniforme).',
    },
  ];

  const sections: InfoSection[] = [
    {
      id: 'pipeline',
      icon: <Layers className="w-3.5 h-3.5 text-[#2563eb]" />,
      title: 'Pipeline de 2 etapas',
      summary: 'Transformar la imagen → comprimir al formato final.',
      active: true,
      details: [
        'Etapa 1: redimensionado, rotación, recorte, upscaling, Claridad HD, marca de agua.',
        'Etapa 2: aplica el modo de calidad elegido (Sin Pérdida, % fijo o Límite KB).',
        'Salvaguarda: si el resultado pesa más que el original sin cambios, devuelve el original.',
      ],
    },
    {
      id: 'quality',
      icon: <Sliders className="w-3.5 h-3.5 text-emerald-400" />,
      title: 'Modos de calidad',
      summary: qualityLabel,
      active: true,
      details: [
        'Sin Pérdida: no degrada la imagen. Si no hay cambios, devuelve el original (o limpia metadatos).',
        'Calidad %: comprime al porcentaje exacto que elijas.',
        'Límite KB: baja la calidad de 5 en 5 hasta alcanzar el peso objetivo.',
      ],
    },
    {
      id: 'resize',
      icon: <Maximize2 className="w-3.5 h-3.5 text-amber-400" />,
      title: 'Redimensionado & recorte',
      summary: resizeLabel,
      active: resizeMode === 'custom' || upscaleFactor > 1,
      details: [
        'Inside: encaja sin recortar ni agrandar.',
        'Cover: llena el marco recortando bordes.',
        'Contain: añade relleno (blur o color sólido).',
        'Upscaling 2x/4x con interpolación Lanczos3.',
      ],
    },
    {
      id: 'clarity',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      title: 'Claridad HD',
      summary: clarity ? 'Activo — recupera nitidez' : 'Desactivado',
      active: clarity,
      details: [
        'Recupera nitidez tras compresión agresiva.',
        'Reduce ruido sutil sin perder detalle visible.',
        'Recomendado con Límite KB bajo en imágenes con bordes finos.',
      ],
    },
    {
      id: 'formats',
      icon: <FileImage className="w-3.5 h-3.5 text-cyan-400" />,
      title: 'Formatos de salida',
      summary: format === 'original' ? 'Conserva formato original' : `Conversión a ${format.toUpperCase()}`,
      active: format !== 'original',
      details: [
        'WebP / AVIF: máxima compresión para web.',
        'JPEG: compatibilidad universal.',
        'PNG: ideal para transparencias.',
      ],
    },
    {
      id: 'precompress',
      icon: <Cpu className="w-3.5 h-3.5 text-rose-400" />,
      title: 'Pre-compresión en navegador',
      summary: 'Archivos >4.1 MB se adaptan antes de subir',
      active: false,
      details: [
        'Reduce imágenes muy grandes antes del envío (máx. 4096 px).',
        'Badge "Auto-adaptado (>4.5MB)" en la tabla cuando ocurre.',
      ],
    },
    {
      id: 'security',
      icon: <Shield className="w-3.5 h-3.5 text-slate-400" />,
      title: 'Privacidad & metadatos',
      summary: stripExif ? 'EXIF eliminado por defecto' : 'EXIF conservado',
      active: stripExif,
      details: [
        'Elimina GPS, cámara, fecha y datos personales embebidos.',
        'En PNG de IA, elimina prompts y parámetros de generación.',
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
              Por qué una foto de 2–4 MB puede pesar mucho menos y verse igual
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
          {/* Frase resumen */}
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-[11px] text-emerald-300 leading-relaxed font-sans">
              <span className="font-bold text-emerald-400">En resumen:</span>{' '}
              no recortamos tu foto ni la achicamos (salvo que tú lo pidas). La guardamos de forma más
              inteligente, quitando lo invisible. Es como pasar de una caja grande con relleno a una caja
              justa con lo mismo adentro.
            </p>
          </div>

          {/* Bloques didácticos */}
          <div className="space-y-2">
            {didacticBlocks.map((block) => (
              <div
                key={block.id}
                className="p-3 rounded-lg border border-[#232730] bg-[#0c0d10]/60"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">{block.icon}</span>
                  <div>
                    <h4 className="text-[11px] font-mono font-bold text-white mb-1">
                      {block.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                      {block.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla comparativa simple */}
          <div className="rounded-lg border border-[#232730] overflow-hidden">
            <div className="px-3 py-2 bg-[#0c0d10] border-b border-[#232730]">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                ¿Qué ahorra más peso?
              </span>
            </div>
            <div className="divide-y divide-[#232730]/60 text-[10.5px] font-sans">
              {[
                { op: 'Quitar solo metadatos (GPS, cámara…)', save: '1–10%', note: 'Poco impacto' },
                { op: 'Re-empaquetar la imagen (misma resolución)', save: '30–60%', note: 'Muy común' },
                { op: 'Cambiar a WebP / AVIF', save: '30–50%', note: 'Ideal para web' },
                { op: 'Reducir resolución (ej. 4000→800 px)', save: '60–95%', note: 'El más agresivo' },
              ].map((row) => (
                <div key={row.op} className="flex items-center gap-2 px-3 py-2 text-slate-400">
                  <span className="flex-1 leading-relaxed">{row.op}</span>
                  <span className="font-mono font-bold text-emerald-400 whitespace-nowrap">{row.save}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración activa */}
          <div className="p-3 rounded-lg bg-[#0c0d10] border border-[#2563eb]/20 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#2563eb] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3" />
              <span>Con tu configuración actual</span>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans pb-1">
              {qualityLabelSimple}
            </p>
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

          {/* Cuándo SÍ se notaría */}
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <p className="text-[10.5px] text-amber-300/90 leading-relaxed font-sans">
              <span className="font-bold text-amber-400">¿Cuándo podrías notar diferencia?</span>{' '}
              Con compresión muy agresiva (objetivo &lt;100 KB en fotos grandes), texto pequeño, logos
              nítidos, o fondos de color plano (cielo, pared lisa). En fotos normales es raro ver cambios
              al comparar con zoom.
            </p>
          </div>

          {/* Detalles técnicos (colapsable) */}
          <button
            type="button"
            onClick={() => setShowTechnical((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-[#232730] bg-[#0c0d10]/40 hover:bg-[#14161b]/60 transition text-left"
            aria-expanded={showTechnical}
          >
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Detalles técnicos (para curiosos)
            </span>
            {showTechnical ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {showTechnical && (
            <div className="space-y-2">
              {sections.map((section) => (
                <details
                  key={section.id}
                  className="group rounded-lg border border-[#232730] bg-[#0c0d10]/60 overflow-hidden"
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
          )}
        </div>
      )}
    </div>
  );
};
