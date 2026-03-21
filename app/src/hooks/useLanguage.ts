import { createContext, useContext, useState, useCallback } from 'react';
import translations, { type LangCode, type Translations } from '../i18n/translations';

export type { LangCode };

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

export const SUPPORTED_LANGS: LangCode[] = ['en', 'es', 'zh', 'ru', 'ro', 'pt'];

const detectLanguage = (): LangCode => {
  try {
    const stored = localStorage.getItem('solaris_lang');
    if (stored && (SUPPORTED_LANGS as string[]).includes(stored)) {
      return stored as LangCode;
    }
    // Check navigator.languages (ordered preference list) before falling back
    // to navigator.language so a secondary preferred language is honoured.
    const candidates = [
      ...(navigator.languages ?? []),
      navigator.language,
    ];
    for (const lang of candidates) {
      const code = lang.slice(0, 2);
      if ((SUPPORTED_LANGS as string[]).includes(code)) {
        return code as LangCode;
      }
    }
    return 'en';
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
