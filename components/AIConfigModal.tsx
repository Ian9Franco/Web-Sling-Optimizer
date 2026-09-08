'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  Zap,
  Info
} from 'lucide-react';
import { AISettings, AIProvider } from '../types/ai';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (settings: Partial<AISettings>) => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [provider, setProvider] = useState<AIProvider>(settings.provider);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [openaiApiKey, setOpenaiApiKey] = useState(settings.openaiApiKey);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel);
  const [customContext, setCustomContext] = useState(settings.customContext);
  const [language, setLanguage] = useState<'es' | 'en'>(settings.language);

  const [showKey, setShowKey] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      provider,
      geminiApiKey: geminiApiKey.trim(),
      openaiApiKey: openaiApiKey.trim(),
      geminiModel,
      openaiModel,
      customContext: customContext.trim(),
      language,
    });
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const activeKey = provider === 'gemini' ? geminiApiKey : openaiApiKey;
  const setActiveKey = provider === 'gemini' ? setGeminiApiKey : setOpenaiApiKey;

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111522] border border-[#1e2638] rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold text-white flex items-center gap-2">
                Configuración de IA Multimodal
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Genera nombres SEO y textos ALT analizando la imagen con visión artificial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#181d2e] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Proveedor Selector */}
        <div className="space-y-2 font-mono text-xs">
          <label className="text-slate-300 font-bold block">Proveedor de Inteligencia Artificial:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                provider === 'gemini'
                  ? 'bg-[#2563eb]/20 border-[#2563eb] text-white'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">Google Gemini</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                  GRATIS (Free Tier)
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Ultra rápido, 15 peticiones por minuto gratis en Google AI Studio.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                provider === 'openai'
                  ? 'bg-[#2563eb]/20 border-[#2563eb] text-white'
                  : 'bg-[#0c0d10] border-[#232730] text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-200">OpenAI</span>
                <span className="bg-[#232730] text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                  GPT-4o mini
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Requiere saldo en cuenta de API Platform de OpenAI.
              </span>
            </button>
          </div>
        </div>

        {/* API Key Input con Enlace Rápido */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-bold">
              Clave de API ({provider === 'gemini' ? 'Google AI Studio' : 'OpenAI'}):
            </label>
            <a
              href={provider === 'gemini' ? 'https://aistudio.google.com/app/apikey' : 'https://platform.openai.com/api-keys'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563eb] hover:text-[#3b82f6] text-[11px] flex items-center gap-1 underline underline-offset-2"
            >
              <span>Obtener clave {provider === 'gemini' ? 'gratis en Google' : 'en OpenAI'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              value={activeKey}
              onChange={(e) => setActiveKey(e.target.value)}
              className="w-full bg-[#0c0d10] border border-[#232730] focus:border-[#2563eb] text-xs px-3 py-2 pr-10 rounded text-white outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 text-slate-400 hover:text-white"
              title={showKey ? 'Ocultar clave' : 'Mostrar clave'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Aviso sobre ChatGPT Plus */}
          {provider === 'openai' && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded text-[10px] text-amber-300 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Nota sobre suscripción Plus:</strong> La suscripción mensual a ChatGPT Plus no incluye uso de la API. La plataforma para desarrolladores de OpenAI requiere recargar saldo de créditos para funcionar.
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Se guarda únicamente en el navegador (localStorage). Privacidad total.</span>
          </div>
        </div>

        {/* Selector de Modelo e Idioma */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Modelo:</label>
            {provider === 'gemini' ? (
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-[#0c0d10] border border-[#232730] text-slate-200 px-2.5 py-1.5 rounded outline-none focus:border-[#2563eb]"
              >
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Recomendado - Estable / Rápido)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nueva generación)</option>
                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B (Ultra liviano)</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
              </select>
            ) : (
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full bg-[#0c0d10] border border-[#232730] text-slate-200 px-2.5 py-1.5 rounded outline-none focus:border-[#2563eb]"
              >
                <option value="gpt-4o-mini">GPT-4o mini (Rápido y económico)</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            )}
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Idioma de salida:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
              className="w-full bg-[#0c0d10] border border-[#232730] text-slate-200 px-2.5 py-1.5 rounded outline-none focus:border-[#2563eb]"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Contexto del Sitio Web (Opcional) */}
        <div className="space-y-1 font-mono text-xs">
          <label className="text-slate-300 block">
            Contexto de tu Marca o Sitio (Opcional):
          </label>
          <input
            type="text"
            placeholder="Ej. Tienda online de muebles vintage en Madrid, priorizar estilo y materiales..."
            value={customContext}
            onChange={(e) => setCustomContext(e.target.value)}
            className="w-full bg-[#0c0d10] border border-[#232730] text-slate-200 px-3 py-1.5 rounded outline-none focus:border-[#2563eb] text-xs"
          />
          <p className="text-[10px] text-slate-500">
            Ayuda al modelo a generar nombres y textos ALT orientados al nicho de tu negocio.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#232730] font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#14161b] text-slate-400 hover:text-white border border-[#232730] transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold flex items-center gap-1.5 transition shadow-lg shadow-[#2563eb]/20"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Guardar en Localhost</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
