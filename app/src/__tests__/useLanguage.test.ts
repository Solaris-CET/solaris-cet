import { describe, it, expect } from "vitest";
import { SUPPORTED_LANGS } from "../hooks/useLanguage";
import translations from "../i18n/translations";
import type { LangCode } from "../i18n/translations";

// ─── detectLanguage (pure logic, testable in node env) ────────────────────

describe("SUPPORTED_LANGS constant", () => {
  it("contains exactly the five expected language codes", () => {
    expect(SUPPORTED_LANGS).toEqual(
      expect.arrayContaining(["en", "es", "zh", "ru", "ro"])
    );
    expect(SUPPORTED_LANGS).toHaveLength(5);
  });

  it("matches the keys available in the translations object", () => {
    const translationKeys = Object.keys(translations) as LangCode[];
    expect(SUPPORTED_LANGS.sort()).toEqual(translationKeys.sort());
  });
});

describe("translations default export", () => {
  it("exports a record keyed by every supported language", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations).toHaveProperty(lang);
    }
  });

  it("English translation object has the expected top-level sections", () => {
    expect(translations.en).toHaveProperty("nav");
    expect(translations.en).toHaveProperty("hero");
    expect(translations.en).toHaveProperty("tokenomics");
  });

  it("all supported languages have hero.buyNow as a non-empty string", () => {
    for (const lang of SUPPORTED_LANGS) {
      const buyNow = translations[lang].hero.buyNow;
      expect(typeof buyNow).toBe("string");
      expect(buyNow.trim().length).toBeGreaterThan(0);
    }
  });

  it("all supported languages have nav.home as a non-empty string", () => {
    for (const lang of SUPPORTED_LANGS) {
      const home = translations[lang].nav.home;
      expect(typeof home).toBe("string");
      expect(home.trim().length).toBeGreaterThan(0);
    }
  });
});
