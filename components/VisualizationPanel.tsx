'use client';

import React from 'react';
import { ProcessedImage } from '../types/image';
import { UploadZone } from './UploadZone';
import { ImageToolbar } from './ImageToolbar';
import { ImageTable } from './ImageTable';
import { ImageGrid } from './ImageGrid';

interface VisualizationPanelProps {
  images: ProcessedImage[];
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
  isDragging: boolean;
  isDesktop: boolean;
  leftColHeight: number | null;
  isZipping: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
  onReprocessBatch: () => void;
  onClearImages: () => void;
  onDownloadAllZip: () => void;
  onUpdateOutputFileName: (id: string, name: string) => void;
  onUpdateAltText: (id: string, alt: string) => void;
  onSelectCropImage: (img: ProcessedImage) => void;
  onSelectPreview: (img: ProcessedImage) => void;
  onSelectSrcset: (img: ProcessedImage) => void;
  onDownloadSingle: (img: ProcessedImage) => void;
  onRemoveSingle: (id: string) => void;
  formatBytes: (bytes: number) => string;
  onAnalyzeSingleAI?: (img: ProcessedImage) => void;
  analyzingId?: string | null;
  onBatchAI?: () => void;
  isAnalyzingAI?: boolean;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  images,
  viewMode,
  setViewMode,
  isDragging,
  isDesktop,
  leftColHeight,
  isZipping,
  onFilesSelected,
  onReprocessBatch,
  onClearImages,
  onDownloadAllZip,
  onUpdateOutputFileName,
  onUpdateAltText,
  onSelectCropImage,
  onSelectPreview,
  onSelectSrcset,
  onDownloadSingle,
  onRemoveSingle,
  formatBytes,
  onAnalyzeSingleAI,
  analyzingId,
  onBatchAI,
  isAnalyzingAI,
}) => {
  return (
    <div 
      className="flex-1 min-w-0 max-w-[900px] w-full flex flex-col gap-4"
      style={{
        height: isDesktop && leftColHeight && images.length > 0 ? `${leftColHeight}px` : undefined,
        maxHeight: isDesktop && leftColHeight ? `${leftColHeight}px` : undefined,
      }}
    >
      <div className="flex-shrink-0">
        <UploadZone
          onFilesSelected={onFilesSelected}
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); }}
          onDragLeave={() => {}}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files);
          }}
        />
      </div>

      {images.length > 0 && (
        <ImageToolbar
          count={images.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onReprocess={onReprocessBatch}
          onClear={onClearImages}
          onDownloadZip={onDownloadAllZip}
          isZipping={isZipping}
          hasDoneImages={images.some(i => i.status === 'done')}
          onBatchAI={onBatchAI}
          isAnalyzingAI={isAnalyzingAI}
        />
      )}

      {images.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
          {viewMode === 'table' ? (
            <ImageTable
              images={images}
              onUpdateOutputFileName={onUpdateOutputFileName}
              onUpdateAltText={onUpdateAltText}
              onSelectCropImage={onSelectCropImage}
              onSelectPreview={onSelectPreview}
              onSelectSrcset={onSelectSrcset}
              onDownloadSingle={onDownloadSingle}
              onRemoveSingle={onRemoveSingle}
              formatBytes={formatBytes}
              onAnalyzeSingleAI={onAnalyzeSingleAI}
              analyzingId={analyzingId}
            />
          ) : (
            <ImageGrid
              images={images}
              onUpdateOutputFileName={onUpdateOutputFileName}
              onUpdateAltText={onUpdateAltText}
              onSelectSrcset={onSelectSrcset}
              onDownloadSingle={onDownloadSingle}
              onRemoveSingle={onRemoveSingle}
              formatBytes={formatBytes}
              onAnalyzeSingleAI={onAnalyzeSingleAI}
              analyzingId={analyzingId}
            />
          )}
        </div>
      )}
    </div>
  );
};
