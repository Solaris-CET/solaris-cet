import { createContext, useContext, useState, useCallback } from 'react';
import translations, { type LangCode, type Translations } from '../i18n/translations';

export type { LangCode };

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

export const SUPPORTED_LANGS: LangCode[] = ['en', 'es', 'zh', 'ru', 'ro'];

const detectLanguage = (): LangCode => {
  try {
    const stored = localStorage.getItem('solaris_lang');
    if (stored && (SUPPORTED_LANGS as string[]).includes(stored)) {
      return stored as LangCode;
    }
    const browserLang = navigator.language.slice(0, 2);
    return (SUPPORTED_LANGS as string[]).includes(browserLang) ? (browserLang as LangCode) : 'en';
  } catch {
    return 'en';
  }
};

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
  t: translations.en,
});

export const useLanguage = () => useContext(LanguageContext);

export const useLanguageState = (): LanguageContextValue => {
  const [lang, setLangState] = useState<LangCode>(detectLanguage);

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem('solaris_lang', newLang);
    } catch {
      // ignore storage errors (e.g. in private browsing)
    }
  }, []);

  return { lang, setLang, t: translations[lang] };
};
