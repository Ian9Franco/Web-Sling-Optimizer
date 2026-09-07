export interface ProcessedImage {
  id: string;
  originalName: string;
  outputFileName: string;
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  qualityApplied: number;
  formatApplied: string;
  savedPercentage: number;
  base64Data: string;
  mimeType: string;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export type CropFit = 'inside' | 'cover';
export type CropPosition = 'center' | 'top' | 'bottom' | 'entropy' | 'attention';

export interface ReprocessOverrides {
  maxKB?: number;
  resizeMode?: 'none' | 'custom';
  customWidth?: string;
  customHeight?: string;
  format?: string;
  cropFit?: CropFit;
  cropPosition?: CropPosition;
}
