import { describe, it, expect } from "vitest";
import translations, { type LangCode } from "../i18n/translations";

const LANG_CODES: LangCode[] = ["en", "es", "zh", "ru", "ro"];

/** Recursively collect all dot-separated leaf key paths of a plain object. */
function getLeafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return getLeafKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

/** Retrieve a nested value using a dot-separated key path. */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, part) => {
      if (acc !== null && typeof acc === "object") {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
}

describe("translations", () => {
  it("exports an entry for every required language code", () => {
    for (const lang of LANG_CODES) {
      expect(translations[lang]).toBeDefined();
    }
  });

  it("all languages share identical key structure with English", () => {
    const enKeys = getLeafKeys(
      translations.en as unknown as Record<string, unknown>
    ).sort();

    for (const lang of LANG_CODES) {
      const langKeys = getLeafKeys(
        translations[lang] as unknown as Record<string, unknown>
      ).sort();
      expect(langKeys, `${lang} keys do not match English keys`).toEqual(enKeys);
    }
  });

  it("all translation values are non-empty strings", () => {
    for (const lang of LANG_CODES) {
      const root = translations[lang] as unknown as Record<string, unknown>;
      const keys = getLeafKeys(root);
      for (const key of keys) {
        const value = getNestedValue(root, key);
        expect(
          typeof value,
          `${lang}.${key} should be a string`
        ).toBe("string");
        expect(
          (value as string).trim().length,
          `${lang}.${key} should not be empty`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("nav section contains all expected keys for every language", () => {
    const expectedNavKeys = [
      "home",
      "cetApp",
      "tokenomics",
      "roadmap",
      "howToBuy",
      "whitepaper",
      "resources",
    ];
    for (const lang of LANG_CODES) {
      for (const key of expectedNavKeys) {
        expect(
          translations[lang].nav[key as keyof typeof translations.en.nav],
          `${lang}.nav.${key} missing`
        ).toBeTruthy();
      }
    }
  });

  it("hero section contains all expected keys for every language", () => {
    const expectedHeroKeys: Array<keyof typeof translations.en.hero> = [
      "tagline",
      "subtitle",
      "buyNow",
      "learnMore",
    ];
    for (const lang of LANG_CODES) {
      for (const key of expectedHeroKeys) {
        expect(
          translations[lang].hero[key],
          `${lang}.hero.${key} missing`
        ).toBeTruthy();
      }
    }
  });

  it("tokenomics section contains all expected keys for every language", () => {
    const expectedTokenomicsKeys: Array<
      keyof typeof translations.en.tokenomics
    > = ["title", "supply", "poolAddress"];
    for (const lang of LANG_CODES) {
      for (const key of expectedTokenomicsKeys) {
        expect(
          translations[lang].tokenomics[key],
          `${lang}.tokenomics.${key} missing`
        ).toBeTruthy();
      }
    }
  });
});
