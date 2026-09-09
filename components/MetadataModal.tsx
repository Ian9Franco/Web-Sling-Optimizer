'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Camera, 
  Palette, 
  FileText, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Bot, 
  ShieldCheck, 
  Info, 
  Layers,
  Cpu,
  Eye,
  Sliders
} from 'lucide-react';
import { ProcessedImage, ImageMetadataDetails } from '../types/image';

interface MetadataModalProps {
  image: ProcessedImage | null;
  metadata: ImageMetadataDetails | null;
  isLoading?: boolean;
  onClose: () => void;
  formatBytes: (bytes: number) => string;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  image,
  metadata,
  isLoading = false,
  onClose,
  formatBytes,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'camera' | 'technical' | 'rights' | 'raw'>('ai');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!image) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadJson = () => {
    if (!metadata) return;
    const jsonStr = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${image.originalName.replace(/\.[^/.]+$/, "")}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ai = metadata?.aiDetection;
  const camera = metadata?.camera;
  const tech = metadata?.technical;
  const rights = metadata?.rights;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="panel-border bg-[#0f121d] border border-[#232730] max-w-4xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] font-mono animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232730] bg-[#141824] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-[#090b10] border border-[#232730] overflow-hidden flex-shrink-0 flex items-center justify-center relative">
              <img 
                src={image.previewUrl || image.base64Data} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {image.originalName}
                </h3>
                {ai?.isAiGenerated ? (
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>IA: {ai.generator || 'Generativa'}</span>
                  </span>
                ) : camera?.make || camera?.model ? (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Camera className="w-3 h-3 text-blue-400" />
                    <span>Cámara Real</span>
                  </span>
                ) : (
                  <span className="bg-slate-700/40 text-slate-300 border border-slate-600/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>Metadatos Web</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Peso original: <span className="text-slate-200">{formatBytes(image.originalSizeBytes)}</span> &bull; Dimensiones: <span className="text-slate-200">{tech?.width || image.originalWidth || image.finalWidth} &times; {tech?.height || image.originalHeight || image.finalHeight} px</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={!metadata || isLoading}
              title="Descargar reporte de metadatos en JSON"
              className="px-3 py-1.5 bg-[#090b10] hover:bg-[#1a1f2e] border border-[#232730] text-slate-300 hover:text-white rounded text-xs flex items-center gap-1.5 transition disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-[#090b10] hover:bg-[#232730] border border-[#232730] rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#232730] bg-[#0c0e17] px-4 overflow-x-auto text-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Procedencia & Diagnóstico IA</span>
            {ai?.isAiGenerated && (
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'camera'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Cámara & EXIF</span>
            {camera && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'technical'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Color & Archivo Técnico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rights')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'rights'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>IPTC & Autoría</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2.5 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'raw'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>JSON Raw Data</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 custom-scrollbar text-xs">
          
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Cpu className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-slate-300 font-bold">Extrayendo y analizando bloques de metadatos profundos...</p>
              <p className="text-slate-500 text-[11px]">Buscando firmas EXIF, IPTC, XMP, perfiles ICC y chunks de generación IA.</p>
            </div>
          ) : !metadata ? (
            <div className="py-12 text-center text-slate-400">
              No se pudieron obtener los metadatos de esta imagen.
            </div>
          ) : (
            <>
              {/* TAB 1: IA DIAGNOSIS */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  {/* Banner Principal de Veredicto */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    ai?.isAiGenerated 
                      ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                      : camera 
                        ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                        : 'bg-[#141824] border-[#232730] text-slate-300'
                  }`}>
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      ai?.isAiGenerated ? 'bg-purple-500/20 text-purple-300' : camera ? 'bg-blue-500/20 text-blue-300' : 'bg-[#232730] text-slate-400'
                    }`}>
                      {ai?.isAiGenerated ? <Bot className="w-6 h-6" /> : camera ? <Camera className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-white">
                          {ai?.isAiGenerated 
                            ? `Origen IA Confirmado (${ai.generator || 'Generador Desconocido'})`
                            : camera 
                              ? `Fotografía Real Detectada (${camera.make || 'Cámara'} ${camera.model || ''})`
                              : 'Metadatos Estándar / Sin Firmas de IA incrustadas'}
                        </span>
                        {ai?.isAiGenerated && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
                            Confianza: {ai.confidence === 'high' ? 'Alta (100% verificado)' : 'Media (Heurística)'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {ai?.isAiGenerated
                          ? 'Esta imagen contiene bloques de metadatos o chunks estructurales característicos de herramientas de generación artificial. Abajo puedes ver el prompt y parámetros técnicos extraídos.'
                          : camera
                            ? 'La imagen contiene etiquetas EXIF auténticas de hardware fotográfico (apertura, ISO, velocidad, fabricante de cámara).'
                            : 'No se encontraron marcas de agua sintéticas, prompts de difusión ni metadatos EXIF de cámara. La imagen contiene únicamente perfiles de visualización web estándar.'}
                      </p>
                    </div>
                  </div>

                  {/* Sección Prompt Positivo */}
                  {ai?.prompt && (
                    <div className="bg-[#090b10] border border-[#232730] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                          <Sparkles className="w-3.5 h-3.5" />
                          Prompt Positivo de Generación
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ai.prompt!, 'prompt')}
                          className="px-2.5 py-1 bg-[#141824] hover:bg-[#232730] border border-[#232730] text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition"
                        >
                          {copiedField === 'prompt' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-[#111420] border border-[#232730] rounded-lg text-slate-200 text-xs font-mono leading-relaxed select-text whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {ai.prompt}
                      </div>
                    </div>
                  )}

                  {/* Sección Negative Prompt */}
                  {ai?.negativePrompt && (
                    <div className="bg-[#090b10] border border-[#232730] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                          <Sliders className="w-3.5 h-3.5" />
                          Prompt Negativo (Negative Prompt)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ai.negativePrompt!, 'negativePrompt')}
                          className="px-2.5 py-1 bg-[#141824] hover:bg-[#232730] border border-[#232730] text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition"
                        >
                          {copiedField === 'negativePrompt' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 bg-[#111420] border border-[#232730] rounded-lg text-slate-300 text-xs font-mono leading-relaxed select-text whitespace-pre-wrap max-h-36 overflow-y-auto">
                        {ai.negativePrompt}
                      </div>
                    </div>
                  )}

                  {/* Parámetros de Generación Grid */}
                  {ai?.isAiGenerated && (ai.model || ai.seed !== undefined || ai.steps || ai.sampler || ai.cfgScale) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ai.model && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">Modelo / Checkpoint</span>
                          <span className="text-purple-300 font-bold truncate block mt-0.5" title={ai.model}>
                            {ai.model}
                          </span>
                        </div>
                      )}
                      {ai.seed !== undefined && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">Semilla (Seed)</span>
                          <span className="text-white font-bold block mt-0.5">{ai.seed}</span>
                        </div>
                      )}
                      {ai.steps && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">Pasos (Steps)</span>
                          <span className="text-white font-bold block mt-0.5">{ai.steps}</span>
                        </div>
                      )}
                      {ai.sampler && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">Sampler</span>
                          <span className="text-white font-bold block mt-0.5">{ai.sampler}</span>
                        </div>
                      )}
                      {ai.cfgScale !== undefined && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">CFG Scale</span>
                          <span className="text-white font-bold block mt-0.5">{ai.cfgScale}</span>
                        </div>
                      )}
                      {ai.generator && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] block uppercase font-bold">Motor IA</span>
                          <span className="text-purple-300 font-bold block mt-0.5">{ai.generator}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workflow JSON (ComfyUI) */}
                  {ai?.workflowJson && (
                    <div className="bg-[#090b10] border border-[#232730] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase text-[11px]">
                          <Code2 className="w-3.5 h-3.5" />
                          Grafo / Workflow ComfyUI (JSON)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(ai.workflowJson!, 'workflow')}
                          className="px-2.5 py-1 bg-[#141824] hover:bg-[#232730] border border-[#232730] text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition"
                        >
                          {copiedField === 'workflow' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Workflow</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#111420] border border-[#232730] rounded-lg text-slate-400 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-40 overflow-y-auto">
                        {typeof ai.workflowJson === 'string' ? ai.workflowJson : JSON.stringify(ai.workflowJson, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!ai?.isAiGenerated && (
                    <div className="p-4 bg-[#090b10] border border-[#232730] rounded-xl text-slate-400 space-y-2">
                      <p className="font-bold text-slate-300">¿Por qué no aparece como IA?</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                        <li>Muchos sitios (como Reddit, Twitter/X, Discord, Instagram o WhatsApp) <strong>eliminan automáticamente todos los metadatos</strong> y chunks PNG al subir la imagen para ahorrar ancho de banda y proteger la privacidad.</li>
                        <li>Si la imagen fue tomada con una cámara real o creada manualmente en Photoshop/Figma, no contiene parámetros de difusión.</li>
                        <li>Puedes consultar las otras pestañas para ver los perfiles ICC, dimensiones técnicas y datos de captura fotográfica si están disponibles.</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CAMERA & EXIF */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  {camera ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {camera.make && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Fabricante</span>
                          <span className="text-white font-bold block mt-0.5">{camera.make}</span>
                        </div>
                      )}
                      {camera.model && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Modelo de Cámara</span>
                          <span className="text-blue-300 font-bold block mt-0.5">{camera.model}</span>
                        </div>
                      )}
                      {camera.lens && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Objetivo / Lente</span>
                          <span className="text-white font-bold block mt-0.5 truncate" title={camera.lens}>{camera.lens}</span>
                        </div>
                      )}
                      {camera.fNumber && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Apertura (f-stop)</span>
                          <span className="text-white font-bold block mt-0.5">f/{camera.fNumber}</span>
                        </div>
                      )}
                      {camera.exposureTime && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Tiempo de Exposición</span>
                          <span className="text-white font-bold block mt-0.5">{camera.exposureTime}</span>
                        </div>
                      )}
                      {camera.iso && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Sensibilidad ISO</span>
                          <span className="text-white font-bold block mt-0.5">ISO {camera.iso}</span>
                        </div>
                      )}
                      {camera.focalLength && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Distancia Focal</span>
                          <span className="text-white font-bold block mt-0.5">{camera.focalLength} mm</span>
                        </div>
                      )}
                      {camera.dateTimeOriginal && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Fecha de Captura</span>
                          <span className="text-white font-bold block mt-0.5">{new Date(camera.dateTimeOriginal).toLocaleString()}</span>
                        </div>
                      )}
                      {camera.software && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Software / Firmware</span>
                          <span className="text-slate-300 font-bold block mt-0.5 truncate" title={camera.software}>{camera.software}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#090b10] border border-[#232730] rounded-xl text-slate-400 space-y-2">
                      <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-300">No se detectaron datos de cámara EXIF</p>
                      <p className="text-[11px] text-slate-500">Este archivo no contiene etiquetas de hardware fotográfico (apertura, velocidad, ISO, fabricante).</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TECHNICAL & COLOR */}
              {activeTab === 'technical' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Formato Contenedor</span>
                      <span className="text-emerald-400 font-bold block mt-0.5">{tech?.format || 'DESCONOCIDO'}</span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Dimensiones Nativas</span>
                      <span className="text-white font-bold block mt-0.5">
                        {tech?.width || image.originalWidth} &times; {tech?.height || image.originalHeight} px
                      </span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Aspect Ratio</span>
                      <span className="text-white font-bold block mt-0.5">{tech?.aspectRatio || '1:1'}</span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Espacio de Color</span>
                      <span className="text-white font-bold block mt-0.5">{tech?.colorSpace || 'sRGB'}</span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Perfil ICC</span>
                      <span className="text-slate-200 font-bold block mt-0.5 truncate" title={tech?.profileDescription}>
                        {tech?.profileDescription || (tech?.hasIccProfile ? 'Incrustado' : 'Estándar')}
                      </span>
                    </div>
                    {tech?.profileCopyright && (
                      <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Copyright de Perfil ICC</span>
                        <span className="text-slate-300 font-bold block mt-0.5 truncate" title={tech.profileCopyright}>
                          {tech.profileCopyright}
                        </span>
                      </div>
                    )}
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Profundidad de Bits</span>
                      <span className="text-white font-bold block mt-0.5">{tech?.bitDepth || 8} bits</span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Densidad de Resolución</span>
                      <span className="text-white font-bold block mt-0.5">{tech?.densityDpi || 72} DPI</span>
                    </div>
                    <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Peso del Archivo</span>
                      <span className="text-white font-bold block mt-0.5">{formatBytes(image.originalSizeBytes)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RIGHTS & IPTC */}
              {activeTab === 'rights' && (
                <div className="space-y-4">
                  {rights ? (
                    <div className="space-y-3">
                      {rights.title && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Título de la Obra</span>
                          <span className="text-white font-bold block mt-0.5">{rights.title}</span>
                        </div>
                      )}
                      {rights.creator && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Creador / Autor / Artista</span>
                          <span className="text-amber-300 font-bold block mt-0.5">{rights.creator}</span>
                        </div>
                      )}
                      {rights.copyright && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Aviso de Copyright</span>
                          <span className="text-white font-bold block mt-0.5">{rights.copyright}</span>
                        </div>
                      )}
                      {rights.caption && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Descripción / Caption</span>
                          <span className="text-slate-200 block mt-0.5 leading-relaxed">{rights.caption}</span>
                        </div>
                      )}
                      {rights.digitalSourceType && (
                        <div className="bg-[#090b10] border border-[#232730] p-3 rounded-lg">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">Tipo de Fuente Digital (C2PA/IPTC)</span>
                          <span className="text-purple-300 font-bold block mt-0.5">{rights.digitalSourceType}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#090b10] border border-[#232730] rounded-xl text-slate-400 space-y-2">
                      <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-300">No se encontraron metadatos IPTC de autoría</p>
                      <p className="text-[11px] text-slate-500">No hay información de derechos de autor, licencias o artista incrustada en este archivo.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: RAW JSON */}
              {activeTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Diccionario completo de tags extraídos ({Object.keys(metadata.rawTags || {}).length} campos):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(metadata.rawTags, null, 2), 'rawTags')}
                      className="px-2.5 py-1 bg-[#141824] hover:bg-[#232730] border border-[#232730] text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 transition"
                    >
                      {copiedField === 'rawTags' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Tags Raw</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 bg-[#090b10] border border-[#232730] rounded-xl text-slate-300 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto select-text">
                    {JSON.stringify(metadata.rawTags, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#232730] bg-[#141824] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Al comprimir, WebSling limpiará estos metadatos si dejas activa la casilla de seguridad EXIF.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold rounded text-xs transition shadow-sm"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
