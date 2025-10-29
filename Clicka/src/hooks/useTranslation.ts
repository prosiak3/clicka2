import { useCallback } from 'react';
import { useSettings } from '../utils/settings';
import translations from '../translations';
import { Translation } from '../types';

export function useTranslation() {
  const { language } = useSettings();

  const t = useCallback((): Translation => {
    // Get translations for current language, fallback to English if not found
    const currentTranslations = translations[language] || translations.en;

    // Create a proxy to handle missing translations
    return new Proxy(currentTranslations, {
      get(target, prop) {
        // If the translation exists, return it
        if (prop in target) {
          return target[prop as keyof Translation];
        }
        
        // If translation is missing, fallback to English
        const fallback = translations.en[prop as keyof Translation];
        
        // Log missing translation in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation for key "${String(prop)}" in language "${language}"`);
        }
        
        return fallback;
      }
    });
  }, [language]);

  return t();
}