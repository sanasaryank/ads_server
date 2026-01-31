/**
 * useMultilingualName Hook
 * Manages multilingual name display and selection
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DictionaryName } from '../types';

export interface UseMultilingualNameReturn {
  /**
   * Gets the display name in the current language
   * @param name - The multilingual name object or string
   * @param fallback - Fallback text if name is not available
   */
  getDisplayName: (name: DictionaryName | string | undefined, fallback?: string) => string;
  /**
   * Current language key for API (ARM, ENG, RUS)
   */
  currentLangKey: 'ARM' | 'ENG' | 'RUS';
  /**
   * Current i18n language code (hy, en, ru)
   */
  currentLang: string;
}

const LANG_KEY_MAP: Record<string, 'ARM' | 'ENG' | 'RUS'> = {
  'hy': 'ARM',
  'en': 'ENG',
  'ru': 'RUS',
};

export function useMultilingualName(): UseMultilingualNameReturn {
  const { i18n } = useTranslation();

  const currentLangKey = useMemo<'ARM' | 'ENG' | 'RUS'>(() => {
    return LANG_KEY_MAP[i18n.language] || 'ENG';
  }, [i18n.language]);

  const getDisplayName = useMemo(() => {
    return (name: DictionaryName | string | undefined, fallback = ''): string => {
      if (!name) return fallback;
      if (typeof name === 'string') return name;
      if (typeof name === 'object') {
        return name[currentLangKey] || name.ENG || name.ARM || name.RUS || fallback;
      }
      return fallback;
    };
  }, [currentLangKey]);

  return {
    getDisplayName,
    currentLangKey,
    currentLang: i18n.language,
  };
}
