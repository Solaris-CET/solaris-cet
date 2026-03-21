import { describe, it, expect } from "vitest";
import translations, { type LangCode } from "../i18n/translations";

const LANG_CODES: LangCode[] = ["en", "es", "zh", "ru", "ro"];

/**
 * Recursively collects all dot-notation key paths from a nested object.
 * e.g. { nav: { home: 'Home' } } → ['nav.home']
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
 * Recursively collects all leaf values from a nested object.
 */
function collectValues(obj: Record<string, unknown>): unknown[] {
  return Object.values(obj).flatMap((value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return collectValues(value as Record<string, unknown>);
    }
    return [value];
  });
}

describe("translations", () => {
  it("exports translations for all expected language codes", () => {
    for (const lang of LANG_CODES) {
      expect(translations).toHaveProperty(lang);
    }
  });

  it("each language entry is a non-null object", () => {
    for (const lang of LANG_CODES) {
      expect(translations[lang]).toBeDefined();
      expect(typeof translations[lang]).toBe("object");
      expect(translations[lang]).not.toBeNull();
    }
  });

  it("every language has the same translation keys as English", () => {
    const enKeys = collectKeys(
      translations.en as unknown as Record<string, unknown>
    ).sort();

    for (const lang of LANG_CODES) {
      const langKeys = collectKeys(
        translations[lang] as unknown as Record<string, unknown>
      ).sort();
      expect(langKeys, `language "${lang}" has different keys than "en"`).toEqual(
        enKeys
      );
    }
  });

  it("no translation value is an empty string", () => {
    for (const lang of LANG_CODES) {
      const values = collectValues(
        translations[lang] as unknown as Record<string, unknown>
      );
      for (const value of values) {
        expect(
          typeof value === "string" ? value.trim().length : 1,
          `language "${lang}" contains an empty translation string`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("English nav section has all expected navigation keys", () => {
    const { nav } = translations.en;
    expect(nav.home).toBeDefined();
    expect(nav.cetApp).toBeDefined();
    expect(nav.tokenomics).toBeDefined();
    expect(nav.roadmap).toBeDefined();
    expect(nav.howToBuy).toBeDefined();
    expect(nav.whitepaper).toBeDefined();
    expect(nav.resources).toBeDefined();
  });

  it("English hero section has all expected keys", () => {
    const { hero } = translations.en;
    expect(hero.tagline).toBeDefined();
    expect(hero.subtitle).toBeDefined();
    expect(hero.buyNow).toBeDefined();
    expect(hero.learnMore).toBeDefined();
  });

  it("English tokenomics section has all expected keys", () => {
    const { tokenomics } = translations.en;
    expect(tokenomics.title).toBeDefined();
    expect(tokenomics.supply).toBeDefined();
    expect(tokenomics.poolAddress).toBeDefined();
  });

  it("token supply mentions 9,000 CET in every language", () => {
    // The hero subtitle in every language should reference the 9,000 supply figure.
    // Different locales use different thousands separators: comma (en/es/zh),
    // period (ro), thin/narrow-no-break-space (ru).
    for (const lang of LANG_CODES) {
      const subtitle = translations[lang].hero.subtitle;
      expect(
        subtitle,
        `language "${lang}" hero subtitle does not mention 9,000/9.000/9 000 CET`
      ).toMatch(/9[.,\u00a0\u202f ]000/);
    }
  });
});
