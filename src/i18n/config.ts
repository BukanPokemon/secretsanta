import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './en';
import { id } from './id';

export type Translations = typeof en;

const resources = {
  en: { translation: en },
  id: { translation: id }
} satisfies Record<string, { translation: Translations }>;

export const SUPPORTED_LANGUAGES = Object.keys(resources);

i18n
  .use(LanguageDetector) // mendeteksi bahasa browser
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id', // default ke Bahasa Indonesia jika deteksi tidak berhasil
    // No hardcoded `lng` here — the route (`/id/`, `/en/`) is the source of
    // truth for which language actually renders (see LocalePage in
    // index.tsx), so this is only used by RootRedirect's `/` -> `/id/` or
    // `/en/` decision, which should reflect a returning visitor's cached
    // choice or their browser's language, not always be forced to 'id'.
    interpolation: {
      escapeValue: false
    }
  });

// Type augmentation untuk useTranslation hook
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: typeof resources['en'];
  }
}

export default i18n;
