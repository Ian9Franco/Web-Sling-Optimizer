'use client';

import { useState, useEffect } from 'react';
import { AISettings } from '../types/ai';

const STORAGE_KEY = 'websling_ai_settings_v1';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  geminiApiKey: '',
  openaiApiKey: '',
  geminiModel: 'gemini-1.5-flash-latest',
  openaiModel: 'gpt-4o-mini',
  customContext: '',
  language: 'es',
};

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Error loading AI settings from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateSettings = (newSettings: Partial<AISettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Error saving AI settings to localStorage:', err);
        }
      }
      return updated;
    });
  };

  const activeApiKey = settings.provider === 'gemini' ? settings.geminiApiKey : settings.openaiApiKey;
  const isConfigured = Boolean(activeApiKey && activeApiKey.trim().length > 5);

  return {
    settings,
    updateSettings,
    isLoaded,
    isConfigured,
  };
}
