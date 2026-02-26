import type { DictionaryKey, DictionaryName } from '../types';
import i18n from 'i18next';

/**
 * Get the display name from a multilingual dictionary name object
 * based on the current language, with fallback to Armenian
 */
export const getDisplayName = (name: DictionaryName, currentLang?: string): string => {
  const lang = currentLang || i18n.language || 'hy'; // default to Armenian
  
  // Map i18n language codes to API language codes
  const langMap: Record<string, keyof DictionaryName> = {
    'hy': 'ARM',
    'ru': 'RUS',
    'en': 'ENG',
  };
  
  const apiLangKey = langMap[lang] || 'ARM';
  
  // Return the name in the current language, or fallback to Armenian
  return name[apiLangKey] || name.ARM || name.ENG || name.RUS || '';
};

export interface DictionaryFieldsConfig {
  hasCountrySelector: boolean;
  hasCitySelector: boolean;
  hasSlotFields: boolean;
}

/**
 * Returns a readable title for a dictionary key
 */
export const getDictionaryTitle = (dictKey: DictionaryKey): string => {
  const keys: Record<DictionaryKey, string> = {
    'restaurant-types': 'menu.restaurantTypes',
    'price-segments': 'menu.priceSegments',
    'menu-types': 'menu.menuTypes',
    'integration-types': 'menu.integrationTypes',
    'slots': 'menu.slots',
    'countries': 'menu.countries',
    'cities': 'menu.cities',
    'districts': 'menu.districts',
  };

  return i18n.t(keys[dictKey] || dictKey);
};

/**
 * Returns configuration for dictionary fields (which selectors to show)
 */
export const getDictionaryFieldsConfig = (dictKey: DictionaryKey): DictionaryFieldsConfig => {
  switch (dictKey) {
    case 'cities':
      return {
        hasCountrySelector: true,
        hasCitySelector: false,
        hasSlotFields: false,
      };
    case 'districts':
      return {
        hasCountrySelector: false,
        hasCitySelector: true,
        hasSlotFields: false,
      };
    case 'slots':
      return {
        hasCountrySelector: false,
        hasCitySelector: false,
        hasSlotFields: true,
      };
    default:
      return {
        hasCountrySelector: false,
        hasCitySelector: false,
        hasSlotFields: false,
      };
  }
};
