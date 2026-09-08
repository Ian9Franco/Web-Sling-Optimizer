'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { FaviconResponse } from '../types/image';

export function useFaviconGenerator() {
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconCustomName, setFaviconCustomName] = useState<string>('favicon');
  const [faviconResults, setFaviconResults] = useState<FaviconResponse | null>(null);
  const [isGeneratingFavicons, setIsGeneratingFavicons] = useState(false);

  const handleFaviconProcess = async (file: File) => {
    setFaviconFile(file);
    setIsGeneratingFavicons(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customName', faviconCustomName || 'favicon');
      const res = await fetch('/api/favicon', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al generar favicons');
      setFaviconResults(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error procesando favicons';
      alert(errorMsg);
    } finally {
      setIsGeneratingFavicons(false);
    }
  };

  const downloadFaviconZip = async () => {
    if (!faviconResults) return;
    try {
      const zip = new JSZip();
      faviconResults.icons.forEach((icon) => {
        zip.file(icon.name, icon.base64, { base64: true });
      });
      zip.file('site.webmanifest', faviconResults.manifest);

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
    faviconResults,
    setFaviconResults,
    isGeneratingFavicons,
    handleFaviconProcess,
    downloadFaviconZip,
  };
}
