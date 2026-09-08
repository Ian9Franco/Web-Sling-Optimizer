export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  openaiApiKey: string;
  geminiModel: string;
  openaiModel: string;
  customContext: string;
  language: 'es' | 'en';
}

export interface AIDescribeResponse {
  success: boolean;
  fileName?: string;
  altText?: string;
  error?: string;
}

export interface AIInteractionState {
  isActive: boolean;
  provider: AIProvider;
  model: string;
  currentImageName: string;
  currentImagePreview?: string;
  step: 'init' | 'extracting' | 'requesting' | 'analyzing' | 'done' | 'error';
  stepMessage: string;
  generatedFileName?: string;
  generatedAltText?: string;
  currentIndex: number;
  totalImages: number;
  error?: string;
}

