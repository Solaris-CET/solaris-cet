import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations, { type LangCode, type Translations } from '../i18n/translations';
import { getTextDirForLang } from '../lib/textDirection';

export type { LangCode };

interface LanguageContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

export const SUPPORTED_LANGS: LangCode[] = ['en', 'es', 'zh', 'ru', 'ro', 'pt', 'de'];

/**
 * Maps ISO 3166-1 alpha-2 country codes to a supported LangCode.
 * Only countries whose primary official language is a supported locale are listed.
 */
const COUNTRY_LANG_MAP: Partial<Record<string, LangCode>> = {
  // German-speaking countries
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // Spanish-speaking countries
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es',
  UY: 'es', BO: 'es', PY: 'es', EC: 'es', CR: 'es', PA: 'es', DO: 'es',
  CU: 'es', GT: 'es', HN: 'es', SV: 'es', NI: 'es',
  // Chinese-speaking regions
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  // Russian-speaking countries
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
  // Romanian-speaking countries
  RO: 'ro', MD: 'ro',
  // Portuguese-speaking countries
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
};

/**
 * Fetches the visitor's country via a lightweight public geo-IP service and
 * returns the mapped LangCode, or null when the country is unknown / unmapped.
 */
async function detectCountryLanguage(): Promise<LangCode | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const isDev = import.meta.env.DEV;
    const url = isDev ? '/api-country/' : 'https://api.country.is/';
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json() as { country: string };
    return COUNTRY_LANG_MAP[data.country] ?? null;
  } catch {
    return null;
  }
}

const detectLanguage = (): LangCode => {
  try {
    const stored = localStorage.getItem('solaris_lang');
    if (stored && (SUPPORTED_LANGS as string[]).includes(stored)) {
      return stored as LangCode;
    }
    const nav = detectNavigatorLanguage();
    if (nav) return nav;
    return 'en';
  } catch {
    return 'en';
  }
};

function detectNavigatorLanguage(): LangCode | null {
  try {
    const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    for (const lang of candidates) {
      const code = lang.slice(0, 2);
      if ((SUPPORTED_LANGS as string[]).includes(code)) return code as LangCode;
    }
    return null;
  } catch {
    return null;
  }
}

/** `?lang=xx` wins over stored/browser for shareable links and E2E (initializer avoids effect setState lint). */
function readLangQueryParam(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawCandidates = [window.location.href, document.baseURI].filter(
      (v, i, a) => typeof v === 'string' && v && a.indexOf(v) === i,
    ) as string[];

    for (const raw of rawCandidates) {
      const m = /[?&]lang=([^&#]+)/.exec(raw);
      if (m?.[1]) {
        try {
          return decodeURIComponent(m[1]);
        } catch {
          return m[1];
        }
      }

      const hashIndex = raw.indexOf('#');
      if (hashIndex !== -1) {
        const hash = raw.slice(hashIndex + 1);
        const qm = /[?&]lang=([^&#]+)/.exec(hash);
        if (qm?.[1]) {
          try {
            return decodeURIComponent(qm[1]);
          } catch {
            return qm[1];
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function resolveInitialLang(): LangCode {
  if (typeof window !== 'undefined') {
    try {
      const code = readLangQueryParam();
      if (code && (SUPPORTED_LANGS as readonly string[]).includes(code)) {
        const next = code as LangCode;
        try {
          localStorage.setItem('solaris_lang', next);
        } catch {
          void 0;
        }
        return next;
      }
    } catch {
      /* ignore */
    }
  }
  return detectLanguage();
}

/**
 * Same rules as `useLanguageState` initial locale — for `ErrorBoundary`, `aria` primitives, etc.
 * outside the normal React render cycle.
 */
export function getActiveLangSync(): LangCode {
  if (typeof window === 'undefined') return 'en';
  return resolveInitialLang();
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
  t: translations.en,
});

export const useLanguage = () => useContext(LanguageContext);

export const useLanguageState = (): LanguageContextValue => {
  const [lang, setLangState] = useState<LangCode>(resolveInitialLang);

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem('solaris_lang', newLang);
    } catch {
      // ignore storage errors (e.g. in private browsing)
    }
  }, []);

  useEffect(() => {
    try {
      const code = readLangQueryParam();
      if (!code || !(SUPPORTED_LANGS as readonly string[]).includes(code)) return;
      if (code === lang) return;
      const next = code as LangCode;
      queueMicrotask(() => setLangState(next));
    } catch {
      void 0;
    }
  }, [lang]);

  // Geo-IP fallback: fires once on mount when the user has no stored preference.
  // If the visitor's country maps to a supported language, update accordingly.
  useEffect(() => {
    try {
      if (localStorage.getItem('solaris_lang')) return;
    } catch {
      return;
    }
    if (detectNavigatorLanguage()) return;
    detectCountryLanguage().then((countryLang) => {
      if (countryLang) {
        setLangState(countryLang);
      }
    }).catch(() => {
      // silently ignore – geo detection is a best-effort enhancement
    });
  }, []);

  // Keep <html lang> and `dir` in sync for screen readers, SEO, and RTL readiness (WCAG 3.1.2).
  // `data-lang` enables subtle locale-aware typography in App.css (no JS runtime on static surfaces).
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = getTextDirForLang(lang);
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  return { lang, setLang, t: translations[lang] };
};
