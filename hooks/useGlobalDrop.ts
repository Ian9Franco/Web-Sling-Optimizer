'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { FileSystemEntryItem } from '../types/image';

interface UseGlobalDropOptions {
  onFiles: (files: File[]) => void | Promise<void>;
}

export function useGlobalDrop({ onFiles }: UseGlobalDropOptions) {
  const [isDragging, setIsDragging] = useState(false);

  // Helper para escanear carpetas recursivamente
  const scanEntry = async (entry: FileSystemEntryItem): Promise<File[]> => {
    const files: File[] = [];
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file: File) => resolve([file]), () => resolve([]));
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readEntries = async (): Promise<FileSystemEntryItem[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries((entries: FileSystemEntryItem[]) => resolve(entries), () => resolve([]));
        });
      };
      let entries = await readEntries();
      while (entries.length > 0) {
        for (const childEntry of entries) {
          const childFiles = await scanEntry(childEntry);
          files.push(...childFiles);
        }
        entries = await readEntries();
      }
    }
    return files;
  };

  // Procesador de DataTransfer para drag & drop de zips, carpetas y archivos sueltos
  const processDataTransfer = async (dataTransfer: DataTransfer) => {
    const extractedFiles: File[] = [];
    const items = Array.from(dataTransfer.items || []);
    const entries: FileSystemEntryItem[] = [];

    for (const item of items) {
      if ('webkitGetAsEntry' in item && typeof (item as any).webkitGetAsEntry === 'function') {
        const entry = (item as any).webkitGetAsEntry() as FileSystemEntryItem | null;
        if (entry) entries.push(entry);
      }
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        const filesFromEntry = await scanEntry(entry);
        extractedFiles.push(...filesFromEntry);
      }
    } else if (dataTransfer.files) {
      extractedFiles.push(...Array.from(dataTransfer.files));
    }

    const finalImageFiles: File[] = [];

    for (const file of extractedFiles) {
      if (file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFilePromises: Promise<File | null>[] = [];

          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && /\.(jpg|jpeg|png|webp|avif|tiff|bmp)$/i.test(zipEntry.name)) {
              zipFilePromises.push(
                zipEntry.async('blob').then(blob => {
                  const fileName = relativePath.split('/').pop() || zipEntry.name;
                  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
                })
              );
            }
          });

          const unpackedFiles = await Promise.all(zipFilePromises);
          unpackedFiles.forEach(f => { if (f) finalImageFiles.push(f); });
        } catch (err) {
          console.error('Error al descomprimir archivo ZIP:', err);
        }
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|tiff|bmp)$/i.test(file.name)) {
        finalImageFiles.push(file);
      }
    }

    if (finalImageFiles.length > 0) {
      await onFiles(finalImageFiles);
    }
  };

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer) {
        await processDataTransfer(e.dataTransfer);
      }
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        onFiles(pastedFiles);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('paste', handleWindowPaste);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('paste', handleWindowPaste);
    };
  }, [onFiles]);

  return { isDragging, setIsDragging };
}
