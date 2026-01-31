import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import hyTranslation from './locales/hy.json';
import ruTranslation from './locales/ru.json';
import enTranslation from './locales/en.json';

const resources = {
  hy: {
    translation: hyTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'hy', // Armenian as default
    lng: (() => {
      try {
        return localStorage.getItem('language') || 'hy';
      } catch (error) {
        return 'hy';
      }
    })(),

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // Force reload on version change
    load: 'languageOnly',
    cleanCode: true,
  });

export default i18n;
