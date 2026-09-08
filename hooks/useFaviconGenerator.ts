'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { FaviconResponse, FaviconMetadata } from '../types/image';
import { AISettings } from '../types/ai';
import { DEFAULT_FAVICON_METADATA, generateWebManifest, generateHeadSnippet } from '../utils/faviconHelper';

export function useFaviconGenerator() {
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconCustomName, setFaviconCustomName] = useState<string>('favicon');
  const [faviconMetadata, setFaviconMetadata] = useState<FaviconMetadata>(DEFAULT_FAVICON_METADATA);
  const [faviconResults, setFaviconResults] = useState<FaviconResponse | null>(null);
  const [isGeneratingFavicons, setIsGeneratingFavicons] = useState(false);
  const [isGeneratingAIMeta, setIsGeneratingAIMeta] = useState(false);

  const updateMetadataField = (field: keyof FaviconMetadata, value: string) => {
    setFaviconMetadata((prev) => {
      const updated = { ...prev, [field]: value };
      if (faviconResults) {
        setFaviconResults((prevRes) => {
          if (!prevRes) return null;
          return {
            ...prevRes,
            manifest: generateWebManifest(updated, prevRes.icons),
            headSnippet: generateHeadSnippet(updated, faviconCustomName),
            metadata: updated,
          };
        });
      }
      return updated;
    });
  };

  const handleFaviconProcess = async (file: File) => {
    setFaviconFile(file);
    setIsGeneratingFavicons(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customName', faviconCustomName || 'favicon');
      formData.append('appName', faviconMetadata.appName);
      formData.append('shortName', faviconMetadata.shortName);
      formData.append('description', faviconMetadata.description);
      formData.append('themeColor', faviconMetadata.themeColor);
      formData.append('backgroundColor', faviconMetadata.backgroundColor);
      formData.append('keywords', faviconMetadata.keywords || '');

      const res = await fetch('/api/favicon', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al generar favicons');
      setFaviconResults(data);
      if (data.metadata) {
        setFaviconMetadata(data.metadata);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error procesando favicons';
      alert(errorMsg);
    } finally {
      setIsGeneratingFavicons(false);
    }
  };

  const handleGenerateAIMeta = async (aiSettings: AISettings) => {
    if (!faviconFile && !faviconResults?.icons?.length) {
      alert('Primero debes seleccionar un logotipo o imagen.');
      return;
    }

    const apiKey = aiSettings.provider === 'gemini' ? aiSettings.geminiApiKey : aiSettings.openaiApiKey;
    if (!apiKey || apiKey.trim().length < 5) {
      alert('Por favor configura tu API Key de Gemini u OpenAI en el botón ✨ IA.');
      return;
    }

    setIsGeneratingAIMeta(true);
    try {
      const formData = new FormData();
      if (faviconFile) {
        formData.append('file', faviconFile);
      } else if (faviconResults?.icons?.[0]?.base64) {
        formData.append('base64Data', faviconResults.icons[0].base64);
      }

      formData.append('provider', aiSettings.provider);
      formData.append('apiKey', apiKey);
      formData.append('model', aiSettings.provider === 'gemini' ? aiSettings.geminiModel : aiSettings.openaiModel);
      formData.append('customContext', aiSettings.customContext || '');
      formData.append('language', aiSettings.language || 'es');

      const res = await fetch('/api/ai/favicon-meta', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron generar los metadatos con IA.');
      }

      if (data.metadata) {
        const newMeta: FaviconMetadata = data.metadata;
        setFaviconMetadata(newMeta);
        if (faviconResults) {
          setFaviconResults((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              manifest: generateWebManifest(newMeta, prev.icons),
              headSnippet: generateHeadSnippet(newMeta, faviconCustomName),
              metadata: newMeta,
            };
          });
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error procesando metadatos con IA';
      alert(errorMsg);
    } finally {
      setIsGeneratingAIMeta(false);
    }
  };

  const downloadFaviconZip = async () => {
    if (!faviconResults) return;
    try {
      const zip = new JSZip();
      faviconResults.icons.forEach((icon) => {
        zip.file(icon.name, icon.base64, { base64: true });
      });

      // Incluir el webmanifest dinámicamente actualizado
      const currentManifest = generateWebManifest(faviconMetadata, faviconResults.icons);
      zip.file('site.webmanifest', currentManifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favicons_pack_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando zip de favicons:', err);
    }
  };

  const closeFaviconModal = () => {
    setIsFaviconModalOpen(false);
    setFaviconResults(null);
  };

  return {
    isFaviconModalOpen,
    setIsFaviconModalOpen,
    closeFaviconModal,
    faviconFile,
    faviconCustomName,
    setFaviconCustomName,
    faviconMetadata,
    setFaviconMetadata,
    updateMetadataField,
    faviconResults,
    setFaviconResults,
    isGeneratingFavicons,
    isGeneratingAIMeta,
    handleFaviconProcess,
    handleGenerateAIMeta,
    downloadFaviconZip,
  };
}
