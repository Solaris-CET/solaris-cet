import { describe, it, expect } from "vitest";
import translations from "../i18n/translations";
import type { LangCode, Translations } from "../i18n/translations";

const SUPPORTED_LANGS: LangCode[] = ["en", "es", "zh", "ru", "ro"];

/**
 * Recursively collect all dot-notation keys from a nested object.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...collectKeys(value as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

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
