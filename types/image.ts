export interface ProcessedImage {
  id: string;
  originalName: string;
  outputFileName: string;
  altText?: string;
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
  upscaleApplied?: number;
  clarityApplied?: boolean;
}

export type CropFit = 'inside' | 'cover';
export type CropPosition = 'center' | 'top' | 'bottom' | 'entropy' | 'attention';

export interface ReprocessOverrides {
  preserveQuality?: boolean;
  quality?: number;
  maxKB?: number;
  resizeMode?: 'none' | 'custom';
  customWidth?: string;
  customHeight?: string;
  format?: string;
  cropFit?: CropFit;
  cropPosition?: CropPosition;
  upscaleFactor?: 1 | 2 | 4;
  clarity?: boolean;
}

export interface CustomPreset {
  id: string;
  name: string;
  preserveQuality?: boolean;
  quality?: number;
  maxKB: number;
  format: string;
  resizeMode: 'none' | 'custom';
  customWidth: string;
  customHeight: string;
  cropFit: CropFit;
  cropPosition: CropPosition;
  upscaleFactor?: 1 | 2 | 4;
  clarity?: boolean;
}

export interface FaviconIconItem {
  name: string;
  size: number;
  width?: number;
  height?: number;
  base64: string;
}

export interface FaviconResponse {
  success: boolean;
  originalName: string;
  icons: FaviconIconItem[];
  manifest: string;
  headSnippet?: string;
}

export interface FileSystemFileEntryItem {
  isFile: true;
  isDirectory: false;
  file: (success: (file: File) => void, error?: (err: unknown) => void) => void;
}

export interface FileSystemDirectoryReaderItem {
  readEntries: (success: (entries: FileSystemEntryItem[]) => void, error?: (err: unknown) => void) => void;
}

export interface FileSystemDirectoryEntryItem {
  isFile: false;
  isDirectory: true;
  createReader: () => FileSystemDirectoryReaderItem;
}

export type FileSystemEntryItem = FileSystemFileEntryItem | FileSystemDirectoryEntryItem;

