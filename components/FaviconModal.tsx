'use client';

import React, { useRef, useState } from 'react';
import { Package, X, Image as ImageIcon, Check, Download, Copy, Sparkles, Code, FileText, Sliders, Palette } from 'lucide-react';
import { FaviconResponse, FaviconIconItem, FaviconMetadata } from '../types/image';
import { AISettings } from '../types/ai';

interface FaviconModalProps {
  isOpen: boolean;
  onClose: () => void;
  faviconCustomName: string;
  setFaviconCustomName: (val: string) => void;
  faviconFile: File | null;
  faviconMetadata: FaviconMetadata;
  updateMetadataField: (field: keyof FaviconMetadata, value: string) => void;
  faviconResults: FaviconResponse | null;
  setFaviconResults: React.Dispatch<React.SetStateAction<FaviconResponse | null>>;
  isGeneratingFavicons: boolean;
  isGeneratingAIMeta: boolean;
  handleFaviconProcess: (file: File) => Promise<void>;
  handleGenerateAIMeta: (settings: AISettings) => Promise<void>;
  downloadFaviconZip: () => Promise<void>;
  aiSettings: AISettings;
  onOpenAISettings?: () => void;
}

export const FaviconModal: React.FC<FaviconModalProps> = ({
  isOpen,
  onClose,
  faviconCustomName,
  setFaviconCustomName,
  faviconFile,
  faviconMetadata,
  updateMetadataField,
  faviconResults,
  setFaviconResults,
  isGeneratingFavicons,
  isGeneratingAIMeta,
  handleFaviconProcess,
  handleGenerateAIMeta,
  downloadFaviconZip,
  aiSettings,
  onOpenAISettings,
}) => {
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'icons' | 'metadata' | 'head' | 'manifest'>('icons');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  const isAIConfigured = Boolean(
    (aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey)?.trim()?.length > 5
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
      <div className="panel-border bg-[#111522] max-w-2xl w-full p-6 relative font-mono my-8 max-h-[90vh] flex flex-col justify-between">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 bg-[#090b10] border border-[#232730] rounded"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-[#e62429]" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Generador de Paquete de Favicons & Metadatos
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Convierte tu logotipo en un kit web completo (`favicon.ico`, `apple-touch-icon`, `site.webmanifest`) con SEO y metadatos optimizados por IA.
          </p>

          {/* Top Controls: Upload & Prefix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Nombre / Prefijo del Favicon:</label>
              <input
                type="text"
                placeholder="Ej. favicon o mi_icono"
                value={faviconCustomName}
                onChange={(e) => setFaviconCustomName(e.target.value)}
                className="w-full bg-[#090b10] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Análisis de Marca con IA:</label>
              {isAIConfigured ? (
                <button
                  type="button"
                  disabled={isGeneratingAIMeta || isGeneratingFavicons || (!faviconFile && !faviconResults)}
                  onClick={() => handleGenerateAIMeta(aiSettings)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-[#1d4ed8] hover:to-[#6d28d9] disabled:opacity-50 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition shadow-md shadow-[#2563eb]/20"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAIMeta ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAIMeta ? 'Analizando con IA...' : '✨ Autocompletar con IA'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAISettings && onOpenAISettings()}
                  className="w-full py-2 px-3 bg-[#090b10] border border-amber-500/40 hover:border-amber-500 text-amber-300 text-xs rounded flex items-center justify-center gap-1.5 transition"
                  title="Configura tu API Key de Gemini u OpenAI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Configurar API Key para IA</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => faviconInputRef.current?.click()}
            className="panel-border p-5 text-center cursor-pointer border-dashed border-[#232730] hover:border-[#2563eb] bg-[#090b10] mb-5 transition"
          >
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFaviconProcess(e.target.files[0])}
            />
            <ImageIcon className="w-7 h-7 text-[#2563eb] mx-auto mb-1.5" />
            <span className="text-xs font-bold text-white block">
              {faviconFile ? faviconFile.name : 'Seleccionar Logo o Imagen'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Recomendado: PNG/SVG o JPG cuadrado de alta resolución
            </span>
          </div>

          {isGeneratingFavicons && (
            <div className="text-center text-xs text-[#2563eb] animate-pulse mb-4">
              Generando variantes de favicon, tarjeta OpenGraph y webmanifest...
            </div>
          )}

          {/* Main Results Tabs */}
          {faviconResults && (
            <div className="space-y-4">
              {/* Navigation Sub-tabs */}
              <div className="flex border-b border-[#232730] text-xs gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('icons')}
                  className={`px-3 py-1.5 rounded-t flex items-center gap-1.5 transition ${
                    activeTab === 'icons'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'bg-[#090b10] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Iconos ({faviconResults.icons.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`px-3 py-1.5 rounded-t flex items-center gap-1.5 transition ${
                    activeTab === 'metadata'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'bg-[#090b10] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Metadatos & Paleta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('head')}
                  className={`px-3 py-1.5 rounded-t flex items-center gap-1.5 transition ${
                    activeTab === 'head'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'bg-[#090b10] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML &lt;head&gt;</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('manifest')}
                  className={`px-3 py-1.5 rounded-t flex items-center gap-1.5 transition ${
                    activeTab === 'manifest'
                      ? 'bg-[#2563eb] text-white font-bold'
                      : 'bg-[#090b10] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>site.webmanifest</span>
                </button>
              </div>

              {/* Tab 1: Icons Grid */}
              {activeTab === 'icons' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-[10px] text-slate-400">
                  {faviconResults.icons.map((ic: FaviconIconItem, idx: number) => (
                    <div
                      key={idx}
                      className="bg-[#090b10] p-2 rounded border border-[#232730] flex flex-col items-center"
                    >
                      <div className="w-10 h-10 flex items-center justify-center overflow-hidden mb-1">
                        <img
                          src={`data:image/png;base64,${ic.base64}`}
                          alt={ic.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <input
                        type="text"
                        value={ic.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFaviconResults((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              icons: prev.icons.map((item, i) =>
                                i === idx ? { ...item, name: val } : item
                              ),
                            };
                          });
                        }}
                        className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-[9px] font-mono text-center text-slate-200 rounded px-1 py-0.5 outline-none truncate"
                        title="Haz clic para renombrar este archivo"
                      />
                      <span className="text-[9px] text-slate-500 mt-0.5">
                        {ic.width || ic.size}×{ic.height || ic.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Metadatos & Paleta */}
              {activeTab === 'metadata' && (
                <div className="bg-[#090b10] p-4 rounded border border-[#232730] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Nombre de la Aplicación / Marca:
                      </label>
                      <input
                        type="text"
                        value={faviconMetadata.appName}
                        onChange={(e) => updateMetadataField('appName', e.target.value)}
                        placeholder="Ej. WebSling"
                        className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Nombre Corto (PWA Mobile):
                      </label>
                      <input
                        type="text"
                        value={faviconMetadata.shortName}
                        onChange={(e) => updateMetadataField('shortName', e.target.value)}
                        placeholder="Ej. WebSling"
                        className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Descripción SEO & Open Graph:
                    </label>
                    <textarea
                      rows={2}
                      value={faviconMetadata.description}
                      onChange={(e) => updateMetadataField('description', e.target.value)}
                      placeholder="Descripción concisa para motores de búsqueda y redes sociales."
                      className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <Palette className="w-3 h-3 text-[#2563eb]" />
                        <span>Color de Tema (`theme_color`):</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={faviconMetadata.themeColor}
                          onChange={(e) => updateMetadataField('themeColor', e.target.value)}
                          className="w-8 h-8 rounded border border-[#232730] bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={faviconMetadata.themeColor}
                          onChange={(e) => updateMetadataField('themeColor', e.target.value)}
                          className="flex-1 bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <Palette className="w-3 h-3 text-slate-400" />
                        <span>Color de Fondo PWA (`background_color`):</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={faviconMetadata.backgroundColor}
                          onChange={(e) => updateMetadataField('backgroundColor', e.target.value)}
                          className="w-8 h-8 rounded border border-[#232730] bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={faviconMetadata.backgroundColor}
                          onChange={(e) => updateMetadataField('backgroundColor', e.target.value)}
                          className="flex-1 bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Palabras Clave SEO (Keywords):
                    </label>
                    <input
                      type="text"
                      value={faviconMetadata.keywords || ''}
                      onChange={(e) => updateMetadataField('keywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full bg-[#111522] border border-[#232730] focus:border-[#2563eb] text-xs font-mono rounded p-2 text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: HTML Head Snippet */}
              {activeTab === 'head' && (
                <div className="bg-[#090b10] p-3 rounded border border-[#232730] relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400">
                      Copia e inserta este bloque dentro de la etiqueta &lt;head&gt; de tu HTML / Next.js:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (faviconResults.headSnippet) {
                          navigator.clipboard.writeText(faviconResults.headSnippet);
                          setCopiedSnippet(true);
                          setTimeout(() => setCopiedSnippet(false), 2000);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded transition"
                    >
                      {copiedSnippet ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet ? '¡Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto p-3 bg-[#111522] rounded border border-[#232730] max-h-48">
                    {faviconResults.headSnippet}
                  </pre>
                </div>
              )}

              {/* Tab 4: site.webmanifest */}
              {activeTab === 'manifest' && (
                <div className="bg-[#090b10] p-3 rounded border border-[#232730] relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-slate-400">
                      Contenido dinámico de `site.webmanifest` (incluido dentro del .zip descargado):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (faviconResults.manifest) {
                          navigator.clipboard.writeText(faviconResults.manifest);
                          setCopiedManifest(true);
                          setTimeout(() => setCopiedManifest(false), 2000);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded transition"
                    >
                      {copiedManifest ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedManifest ? '¡Copiado!' : 'Copiar Manifest'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto p-3 bg-[#111522] rounded border border-[#232730] max-h-48">
                    {faviconResults.manifest}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {faviconResults && (
          <div className="pt-4 border-t border-[#232730] mt-4">
            <button
              type="button"
              onClick={downloadFaviconZip}
              className="w-full py-2.5 bg-[#e62429] text-white font-bold text-xs rounded hover:bg-[#ff3b30] transition shadow-md shadow-[#e62429]/30 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Download className="w-4 h-4" />
              <span>DESCARGAR PAQUETE COMPLETO (.ZIP)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
