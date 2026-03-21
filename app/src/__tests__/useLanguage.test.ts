import { describe, it, expect } from "vitest";
import { SUPPORTED_LANGS, LanguageContext } from "../hooks/useLanguage";
import type { LangCode } from "../hooks/useLanguage";
import translations from "../i18n/translations";

describe("SUPPORTED_LANGS", () => {
  it("contains exactly 5 language codes", () => {
    expect(SUPPORTED_LANGS).toHaveLength(5);
  });

  it("includes English as first entry", () => {
    expect(SUPPORTED_LANGS[0]).toBe("en");
  });

  it("includes all expected language codes", () => {
    const expected: LangCode[] = ["en", "es", "zh", "ru", "ro"];
    for (const lang of expected) {
      expect(SUPPORTED_LANGS).toContain(lang);
    }
  });

  it("contains only unique values", () => {
    const unique = new Set(SUPPORTED_LANGS);
    expect(unique.size).toBe(SUPPORTED_LANGS.length);
  });

  it("every entry is a non-empty string", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(typeof lang).toBe("string");
      expect(lang.length).toBeGreaterThan(0);
    }
  });
});

describe("LanguageContext default value", () => {
  it("is a React context object (has a Provider property)", () => {
    expect(LanguageContext).toHaveProperty("Provider");
  });

  it("is a React context object (has a Consumer property)", () => {
    expect(LanguageContext).toHaveProperty("Consumer");
  });
});

describe("LangCode type coverage", () => {
  it("translations map satisfies Record<LangCode, Translations>", () => {
    // If TypeScript compiles this, the record is complete
    const langs: LangCode[] = ["en", "es", "zh", "ru", "ro"];
    for (const lang of langs) {
      expect(translations).toHaveProperty(lang);
    }
  });
});
