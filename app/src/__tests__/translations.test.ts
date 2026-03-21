import { describe, it, expect } from 'vitest';
import translations, { type LangCode, type Translations } from '../i18n/translations';
import { SUPPORTED_LANGS } from '../hooks/useLanguage';

/**
 * Validates the completeness and structural consistency of all i18n translation
 * bundles. Every language must supply every key defined in the `Translations`
 * interface — a missing key at runtime would cause a silent undefined render.
 */

/** Recursively collect all dot-paths (e.g. "nav.home") from a nested object. */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

const BASE_LANG: LangCode = 'en';
const baseKeys = collectKeys(translations[BASE_LANG] as unknown as Record<string, unknown>);

describe('i18n translations', () => {
  describe('SUPPORTED_LANGS', () => {
    it('includes the base language (en)', () => {
      expect(SUPPORTED_LANGS).toContain('en');
    });

    it('every language in SUPPORTED_LANGS has a translation bundle', () => {
      for (const lang of SUPPORTED_LANGS) {
        expect(translations).toHaveProperty(lang);
      }
    });

    it('every key in the translations object is listed in SUPPORTED_LANGS', () => {
      const translationLangs = Object.keys(translations) as LangCode[];
      for (const lang of translationLangs) {
        expect(SUPPORTED_LANGS).toContain(lang);
      }
    });
  });

  describe('structural completeness', () => {
    for (const lang of SUPPORTED_LANGS) {
      it(`[${lang}] has all required translation keys`, () => {
        const bundle = translations[lang] as unknown as Record<string, unknown>;
        const langKeys = collectKeys(bundle);

        const missingKeys = baseKeys.filter((k) => !langKeys.includes(k));
        expect(missingKeys).toEqual([]);
      });

      it(`[${lang}] has no extra keys missing from the base (en) schema`, () => {
        const bundle = translations[lang] as unknown as Record<string, unknown>;
        const langKeys = collectKeys(bundle);

        const extraKeys = langKeys.filter((k) => !baseKeys.includes(k));
        expect(extraKeys).toEqual([]);
      });
    }
  });

  describe('translation values', () => {
    for (const lang of SUPPORTED_LANGS) {
      it(`[${lang}] has no empty string values`, () => {
        const bundle = translations[lang] as unknown as Record<string, unknown>;
        const langKeys = collectKeys(bundle);

        const emptyKeys: string[] = [];
        for (const dotPath of langKeys) {
          const parts = dotPath.split('.');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let node: any = bundle;
          for (const part of parts) {
            node = node[part];
          }
          if (node === '') emptyKeys.push(dotPath);
        }
        expect(emptyKeys).toEqual([]);
      });

      it(`[${lang}] all values are strings`, () => {
        const bundle = translations[lang] as unknown as Record<string, unknown>;
        const langKeys = collectKeys(bundle);

        const nonStringKeys: string[] = [];
        for (const dotPath of langKeys) {
          const parts = dotPath.split('.');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let node: any = bundle;
          for (const part of parts) {
            node = node[part];
          }
          if (typeof node !== 'string') nonStringKeys.push(dotPath);
        }
        expect(nonStringKeys).toEqual([]);
      });
    }
  });

  describe('Translations type shape', () => {
    it('nav section has all required navigation keys', () => {
      const requiredNavKeys: Array<keyof Translations['nav']> = [
        'home', 'cetApp', 'tokenomics', 'roadmap', 'howToBuy', 'whitepaper', 'resources',
      ];
      for (const lang of SUPPORTED_LANGS) {
        for (const key of requiredNavKeys) {
          expect(translations[lang].nav[key]).toBeTruthy();
        }
      }
    });

    it('hero section has all required keys', () => {
      const requiredHeroKeys: Array<keyof Translations['hero']> = [
        'tagline', 'subtitle', 'buyNow', 'learnMore',
      ];
      for (const lang of SUPPORTED_LANGS) {
        for (const key of requiredHeroKeys) {
          expect(translations[lang].hero[key]).toBeTruthy();
        }
      }
    });

    it('tokenomics section has all required keys', () => {
      const requiredTokenomicsKeys: Array<keyof Translations['tokenomics']> = [
        'title', 'supply', 'poolAddress',
      ];
      for (const lang of SUPPORTED_LANGS) {
        for (const key of requiredTokenomicsKeys) {
          expect(translations[lang].tokenomics[key]).toBeTruthy();
        }
      }
    });
  });
});
