'use client';

import React from 'react';
import { Bot, X, CheckCircle2, AlertCircle, Loader2, Sparkles, Terminal, FileCode, Type } from 'lucide-react';
import { AIInteractionState } from '../types/ai';

interface AIInteractionPreviewProps {
  state: AIInteractionState | null;
  onClose: () => void;
}

export const AIInteractionPreview: React.FC<AIInteractionPreviewProps> = ({ state, onClose }) => {
  if (!state || !state.isActive) return null;

  const isGemini = state.provider === 'gemini';
  const providerLabel = isGemini ? 'Google Gemini' : 'OpenAI';
  const modelClean = state.model.replace(/^models\//, '');

  return (
    <aside 
      aria-label="Progreso del Modelo IA"
      className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 bg-[#0e121e]/95 backdrop-blur-md border border-[#2563eb]/50 rounded-xl shadow-2xl shadow-black/80 overflow-hidden font-mono text-xs animate-in slide-in-from-bottom-5 duration-300 select-none"
    >
      {/* Glow Bar Top */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2563eb] via-emerald-400 to-[#e62429] animate-pulse" />

      {/* Header */}
      <div className="p-3 bg-[#090b12] border-b border-[#1f2738] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2563eb]/20 border border-[#2563eb]/40 flex items-center justify-center text-[#3b82f6] relative">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-[12px]">{providerLabel}</span>
              <span className="bg-[#1e293b] text-slate-300 text-[9px] px-1.5 py-0.2 rounded border border-slate-700">
                {modelClean}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Visión Multimodal Activa</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1f2738] transition"
          title="Cerrar vista previa"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-3">
        {/* Imagen en proceso */}
        <div className="flex items-center gap-2.5 bg-[#090b10] border border-[#1e2638] p-2 rounded-lg">
          <div className="w-10 h-10 rounded bg-[#151924] border border-[#263044] overflow-hidden flex-shrink-0 flex items-center justify-center">
            {state.currentImagePreview ? (
              <img 
                src={state.currentImagePreview} 
                alt="Mini Preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Bot className="w-5 h-5 text-slate-500 animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Procesando archivo</span>
              {state.totalImages > 1 && (
                <span className="text-emerald-400 font-bold">
                  {state.currentIndex} / {state.totalImages}
                </span>
              )}
            </div>
            <p className="text-white text-[11px] font-bold truncate">
              {state.currentImageName}
            </p>
          </div>
        </div>

        {/* Status / Step terminal */}
        <div className="bg-[#080a10] border border-[#181f30] rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-[#141b2a] pb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Terminal className="w-3 h-3 text-[#3b82f6]" />
              Interacción con Modelo
            </span>
            {state.step === 'done' ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completado
              </span>
            ) : state.step === 'error' ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            ) : (
              <span className="text-[#3b82f6] flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> En vivo
              </span>
            )}
          </div>

          <div className="text-[11px] space-y-1 pt-0.5">
            <p className="text-slate-300 flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">&gt;</span>
              <span>{state.stepMessage}</span>
            </p>
          </div>
        </div>

        {/* Output Preview */}
        {(state.generatedFileName || state.generatedAltText) && (
          <div className="space-y-1.5 bg-[#09101d] border border-emerald-500/30 rounded-lg p-2.5 text-[11px]">
            {state.generatedFileName && (
              <div className="space-y-0.5">
                <span className="text-[9px] text-emerald-400 flex items-center gap-1 uppercase font-bold">
                  <FileCode className="w-3 h-3" /> Nombre SEO:
                </span>
                <p className="text-white font-mono bg-[#0c1322] px-2 py-1 rounded border border-[#1e2a40] truncate">
                  {state.generatedFileName}
                </p>
              </div>
            )}
            {state.generatedAltText && (
              <div className="space-y-0.5">
                <span className="text-[9px] text-emerald-400 flex items-center gap-1 uppercase font-bold">
                  <Type className="w-3 h-3" /> Texto ALT:
                </span>
                <p className="text-slate-300 font-sans text-[11px] bg-[#0c1322] px-2 py-1 rounded border border-[#1e2a40] line-clamp-2">
                  &ldquo;{state.generatedAltText}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
