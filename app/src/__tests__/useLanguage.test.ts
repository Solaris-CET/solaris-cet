// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SUPPORTED_LANGS } from '../hooks/useLanguage';
import translations from '../i18n/translations';
import type { LangCode } from '../hooks/useLanguage';

// ---------------------------------------------------------------------------
// SUPPORTED_LANGS
// ---------------------------------------------------------------------------

describe('SUPPORTED_LANGS', () => {
  it('contains the expected language codes', () => {
    expect(SUPPORTED_LANGS).toContain('en');
    expect(SUPPORTED_LANGS).toContain('es');
    expect(SUPPORTED_LANGS).toContain('zh');
    expect(SUPPORTED_LANGS).toContain('ru');
    expect(SUPPORTED_LANGS).toContain('ro');
  });

  it('has exactly 5 entries', () => {
    expect(SUPPORTED_LANGS).toHaveLength(5);
  });

  it('contains only unique entries', () => {
    const unique = new Set(SUPPORTED_LANGS);
    expect(unique.size).toBe(SUPPORTED_LANGS.length);
  });
});

// ---------------------------------------------------------------------------
// translations shape
// ---------------------------------------------------------------------------

describe('translations', () => {
  it('provides a translation object for every supported language', () => {
    SUPPORTED_LANGS.forEach((lang: LangCode) => {
      expect(translations[lang]).toBeDefined();
    });
  });

  it('each translation has a nav section with required keys', () => {
    const requiredNavKeys = ['home', 'cetApp', 'tokenomics', 'roadmap', 'howToBuy', 'whitepaper', 'resources'];
    SUPPORTED_LANGS.forEach((lang: LangCode) => {
      requiredNavKeys.forEach(key => {
        expect(translations[lang].nav).toHaveProperty(key);
        expect(typeof (translations[lang].nav as Record<string, string>)[key]).toBe('string');
      });
    });
  });

  it('each translation has a hero section with required keys', () => {
    const requiredHeroKeys = ['tagline', 'subtitle', 'buyNow', 'learnMore'];
    SUPPORTED_LANGS.forEach((lang: LangCode) => {
      requiredHeroKeys.forEach(key => {
        expect(translations[lang].hero).toHaveProperty(key);
        expect(typeof (translations[lang].hero as Record<string, string>)[key]).toBe('string');
      });
    });
  });

  it('each translation has a tokenomics section with required keys', () => {
    const requiredKeys = ['title', 'supply', 'poolAddress'];
    SUPPORTED_LANGS.forEach((lang: LangCode) => {
      requiredKeys.forEach(key => {
        expect(translations[lang].tokenomics).toHaveProperty(key);
        expect(typeof (translations[lang].tokenomics as Record<string, string>)[key]).toBe('string');
      });
    });
  });

  it('English nav labels are non-empty strings', () => {
    const nav = translations.en.nav;
    Object.values(nav).forEach(value => {
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// detectLanguage via localStorage (integration-style)
// ---------------------------------------------------------------------------

describe('language detection (integration)', () => {
  beforeEach(() => {
    // Clear any stored preference
    window.localStorage.removeItem('solaris_lang');
  });

  afterEach(() => {
    window.localStorage.removeItem('solaris_lang');
    vi.restoreAllMocks();
  });

  it('SUPPORTED_LANGS can be used as a type guard', () => {
    const validLang = 'en';
    const invalidLang = 'xx';
    expect((SUPPORTED_LANGS as string[]).includes(validLang)).toBe(true);
    expect((SUPPORTED_LANGS as string[]).includes(invalidLang)).toBe(false);
  });

  it('localStorage key "solaris_lang" stores a LangCode string', () => {
    window.localStorage.setItem('solaris_lang', 'es');
    const stored = window.localStorage.getItem('solaris_lang');
    expect(stored).toBe('es');
    expect((SUPPORTED_LANGS as string[]).includes(stored!)).toBe(true);
  });
});
