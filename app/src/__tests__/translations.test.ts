import { describe, it, expect } from "vitest";
import translations from "../i18n/translations";
import { SUPPORTED_LANGS } from "../hooks/useLanguage";
import type { LangCode, Translations } from "../i18n/translations";

/**
 * Recursively collect all dot-separated key paths from a nested object.
 * E.g. { nav: { home: 'Home' } } → ['nav.home']
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

/**
 * Recursively retrieve a value from a nested object using a dot-separated path.
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

describe("i18n translations completeness", () => {
  const referenceLang: LangCode = "en";
  const referenceKeys = collectKeys(
    translations[referenceLang] as unknown as Record<string, unknown>
  );

  it("SUPPORTED_LANGS covers every translation in the translations map", () => {
    const translationKeys = Object.keys(translations) as LangCode[];
    for (const lang of translationKeys) {
      expect(SUPPORTED_LANGS).toContain(lang);
    }
  });

  it("every supported language has an entry in the translations map", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations).toHaveProperty(lang);
    }
  });

  for (const lang of SUPPORTED_LANGS) {
    describe(`language: ${lang}`, () => {
      it(`has all ${referenceKeys.length} keys from the reference (${referenceLang}) translation`, () => {
        const missing: string[] = [];
        for (const key of referenceKeys) {
          const value = getValueByPath(
            translations[lang] as unknown as Record<string, unknown>,
            key
          );
          if (value === undefined) missing.push(key);
        }
        expect(missing).toEqual([]);
      });

      it("has no empty string values", () => {
        const empty: string[] = [];
        for (const key of referenceKeys) {
          const value = getValueByPath(
            translations[lang] as unknown as Record<string, unknown>,
            key
          );
          if (typeof value === "string" && value.trim() === "") {
            empty.push(key);
          }
        }
        expect(empty).toEqual([]);
      });

      it("has no key with value undefined or null", () => {
        const nullish: string[] = [];
        for (const key of referenceKeys) {
          const value = getValueByPath(
            translations[lang] as unknown as Record<string, unknown>,
            key
          );
          if (value === undefined || value === null) nullish.push(key);
        }
        expect(nullish).toEqual([]);
      });
    });
  }
});

describe("i18n translations", () => {
  const englishKeys = collectKeys(translations.en as unknown as Record<string, unknown>);

  it("has entries for every supported language", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations).toHaveProperty(lang);
    }
  });

  it("every language contains all keys present in English", () => {
    for (const lang of SUPPORTED_LANGS) {
      if (lang === "en") continue;
      const langKeys = collectKeys(translations[lang] as unknown as Record<string, unknown>);
      for (const key of englishKeys) {
        expect(langKeys, `'${lang}' is missing key '${key}'`).toContain(key);
      }
    }
  });

  it("no language contains extra keys not present in English", () => {
    for (const lang of SUPPORTED_LANGS) {
      if (lang === "en") continue;
      const langKeys = collectKeys(translations[lang] as unknown as Record<string, unknown>);
      for (const key of langKeys) {
        expect(englishKeys, `'${lang}' has unexpected key '${key}'`).toContain(key);
      }
    }
  });

  it("all translation values are non-empty strings", () => {
    for (const lang of SUPPORTED_LANGS) {
      const entry = translations[lang] as Translations;
      const langObj = entry as unknown as Record<string, unknown>;
      const keys = collectKeys(langObj);
      for (const key of keys) {
        const parts = key.split(".");
        let value: unknown = langObj;
        for (const part of parts) {
          value = (value as Record<string, unknown>)[part];
        }
        expect(
          typeof value,
          `'${lang}.${key}' should be a string`
        ).toBe("string");
        expect(
          (value as string).trim().length,
          `'${lang}.${key}' should not be empty`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("English tagline references Cetățuia", () => {
    expect(translations.en.hero.tagline).toContain("Cetățuia");
  });

  it("buy button text is non-empty for all languages", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations[lang].hero.buyNow.trim().length).toBeGreaterThan(0);
    }
  });
});
