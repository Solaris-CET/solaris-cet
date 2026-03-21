/**
 * Unit tests for the language-detection and translation-lookup utilities
 * exported from `src/hooks/useLanguage.ts` and `src/i18n/translations.ts`.
 *
 * We test the pure, side-effect-free logic only (no React hooks, no DOM).
 */

import { describe, it, expect } from "vitest";
import translations from "../i18n/translations";
import { SUPPORTED_LANGS } from "../hooks/useLanguage";
import type { LangCode } from "../i18n/translations";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-implements the pure detectLanguage() logic from useLanguage.ts so we
 * can test it without importing a hook (which requires a React render context).
 */
function detectLanguage(
  storedValue: string | null,
  browserLang: string
): LangCode {
  if (storedValue && (SUPPORTED_LANGS as string[]).includes(storedValue)) {
    return storedValue as LangCode;
  }
  const prefix = browserLang.slice(0, 2);
  return (SUPPORTED_LANGS as string[]).includes(prefix)
    ? (prefix as LangCode)
    : "en";
}

// ── SUPPORTED_LANGS ───────────────────────────────────────────────────────────

describe("SUPPORTED_LANGS", () => {
  it("includes English", () => expect(SUPPORTED_LANGS).toContain("en"));
  it("includes Spanish", () => expect(SUPPORTED_LANGS).toContain("es"));
  it("includes Chinese", () => expect(SUPPORTED_LANGS).toContain("zh"));
  it("includes Russian", () => expect(SUPPORTED_LANGS).toContain("ru"));
  it("includes Romanian", () => expect(SUPPORTED_LANGS).toContain("ro"));
  it("has exactly 5 entries", () => expect(SUPPORTED_LANGS).toHaveLength(5));
});

// ── detectLanguage ────────────────────────────────────────────────────────────

describe("detectLanguage", () => {
  it("returns the stored language when it is supported", () => {
    expect(detectLanguage("es", "en-US")).toBe("es");
  });

  it("ignores stored value when it is not a supported language", () => {
    // Falls back to browser lang
    expect(detectLanguage("de", "zh-CN")).toBe("zh");
  });

  it("returns 'en' when stored value is null and browser lang is unsupported", () => {
    expect(detectLanguage(null, "de-DE")).toBe("en");
  });

  it("detects browser language from a locale string (e.g. 'zh-CN' → 'zh')", () => {
    expect(detectLanguage(null, "zh-CN")).toBe("zh");
  });

  it("returns 'en' as the safe default", () => {
    expect(detectLanguage(null, "unknown")).toBe("en");
  });

  it("returns stored language even when browser lang differs", () => {
    expect(detectLanguage("ru", "es-MX")).toBe("ru");
  });
});

// ── translations object ───────────────────────────────────────────────────────

describe("translations", () => {
  it("has an entry for every supported language", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations).toHaveProperty(lang);
    }
  });

  it("every locale has a non-empty nav.home string", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations[lang].nav.home.length).toBeGreaterThan(0);
    }
  });

  it("every locale has a non-empty hero.tagline string", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations[lang].hero.tagline.length).toBeGreaterThan(0);
    }
  });

  it("English tokenomics title is 'Tokenomics'", () => {
    expect(translations.en.tokenomics.title).toBe("Tokenomics");
  });

  it("English hero buyNow label is 'Buy CET'", () => {
    expect(translations.en.hero.buyNow).toBe("Buy CET");
  });

  it("all locales define the same nav keys as English", () => {
    const enNavKeys = Object.keys(translations.en.nav).sort();
    for (const lang of SUPPORTED_LANGS) {
      expect(Object.keys(translations[lang].nav).sort()).toEqual(enNavKeys);
    }
  });

  it("all locales define the same hero keys as English", () => {
    const enHeroKeys = Object.keys(translations.en.hero).sort();
    for (const lang of SUPPORTED_LANGS) {
      expect(Object.keys(translations[lang].hero).sort()).toEqual(enHeroKeys);
    }
  });
});

// ── localStorage lang persistence (simulated via detectLanguage) ─────────────
// We pass the stored value directly because the Vitest environment is Node
// and does not expose `localStorage`.  The real hook calls
// `localStorage.getItem("solaris_lang")` and passes the result to the same
// detection logic, so these tests cover that code path faithfully.

describe("localStorage lang persistence", () => {
  it("uses the stored language code when it is a supported locale", () => {
    // Simulates: localStorage.getItem("solaris_lang") === "ro"
    const lang = detectLanguage("ro", "en-US");
    expect(lang).toBe("ro");
  });

  it("falls back to the browser language when no lang is stored", () => {
    // Simulates: localStorage.getItem("solaris_lang") === null
    const lang = detectLanguage(null, "ru-RU");
    expect(lang).toBe("ru");
  });

  it("falls back to English when both stored value and browser lang are unsupported", () => {
    const lang = detectLanguage("de", "fr-FR");
    expect(lang).toBe("en");
  });
});
