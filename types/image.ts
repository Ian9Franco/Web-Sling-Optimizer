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
  metadataDetails?: ImageMetadataDetails;
}

export interface AiDetectionResult {
  isAiGenerated: boolean;
  generator?: string; // 'Stable Diffusion' | 'Midjourney' | 'DALL-E 3' | 'ComfyUI' | 'Adobe Firefly' | 'NovelAI' | 'Synthetic Media (IPTC/C2PA)' | 'Unknown AI'
  confidence: 'high' | 'medium' | 'low' | 'none';
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  seed?: string | number;
  steps?: number;
  sampler?: string;
  cfgScale?: number;
  workflowJson?: string;
  rawParams?: string;
  additionalDetails?: Record<string, any>;
}

export interface ExifCameraDetails {
  make?: string;
  model?: string;
  lens?: string;
  software?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string | number;
  focalLength?: number;
  dateTimeOriginal?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  whiteBalance?: string;
  flash?: string;
}

export interface IptcRightsDetails {
  title?: string;
  creator?: string;
  credit?: string;
  copyright?: string;
  caption?: string;
  keywords?: string[];
  digitalSourceType?: string;
}

export interface ColorAndTechnicalDetails {
  colorSpace?: string;
  profileDescription?: string;
  profileCopyright?: string;
  hasIccProfile?: boolean;
  bitDepth?: number;
  channels?: number;
  densityDpi?: number;
  isProgressive?: boolean;
  format?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fileSizeBytes?: number;
}

export interface ImageMetadataDetails {
  hasMetadata: boolean;
  aiDetection: AiDetectionResult;
  camera?: ExifCameraDetails;
  rights?: IptcRightsDetails;
  technical: ColorAndTechnicalDetails;
  rawTags: Record<string, any>;
}

export type CropFit = 'inside' | 'cover' | 'contain';
export type CropPosition = 
  | 'center' 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'north' 
  | 'south' 
  | 'east' 
  | 'west' 
  | 'northeast' 
  | 'northwest' 
  | 'southeast' 
  | 'southwest' 
  | 'entropy' 
  | 'attention';
export type ContainBackground = 'blur' | 'black' | 'white' | 'transparent' | string;

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
  containBackground?: ContainBackground;
  borderPadding?: number;
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
  containBackground?: ContainBackground;
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

export interface FaviconMetadata {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  keywords?: string;
}

export interface FaviconResponse {
  success: boolean;
  originalName: string;
  icons: FaviconIconItem[];
  manifest: string;
  headSnippet?: string;
  metadata?: FaviconMetadata;
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

