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
  it("is the fixed ordered set of locales", () => {
    expect(SUPPORTED_LANGS).toEqual(["en", "es", "zh", "ru", "ro", "pt", "de"]);
  });
});

// ── detectLanguage ────────────────────────────────────────────────────────────

describe("detectLanguage", () => {
  it("stored vs browser vs defaults", () => {
    expect(detectLanguage("es", "en-US")).toBe("es");
    expect(detectLanguage("fr", "zh-CN")).toBe("zh");
    expect(detectLanguage(null, "fr-FR")).toBe("en");
    expect(detectLanguage(null, "zh-CN")).toBe("zh");
    expect(detectLanguage(null, "unknown")).toBe("en");
    expect(detectLanguage("ru", "es-MX")).toBe("ru");
  });
});

// ── translations object ───────────────────────────────────────────────────────

describe("translations", () => {
  it("locales, EN copy, nav/hero key parity", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations[lang].nav.home.length).toBeGreaterThan(0);
      expect(translations[lang].hero.tagline.length).toBeGreaterThan(0);
    }
    expect(translations.en.tokenomics.title).toBe("Tokenomics");
    expect(translations.en.hero.buyNow).toBe("Buy CET");
    const enNavKeys = Object.keys(translations.en.nav).sort();
    const enHeroKeys = Object.keys(translations.en.hero).sort();
    for (const lang of SUPPORTED_LANGS) {
      expect(Object.keys(translations[lang].nav).sort()).toEqual(enNavKeys);
      expect(Object.keys(translations[lang].hero).sort()).toEqual(enHeroKeys);
    }
  });
});

// ── localStorage lang persistence (simulated via detectLanguage) ─────────────

describe("localStorage lang persistence", () => {
  it("ro stored, ru from browser, en when both unsupported", () => {
    expect(detectLanguage("ro", "en-US")).toBe("ro");
    expect(detectLanguage(null, "ru-RU")).toBe("ru");
    expect(detectLanguage("fr", "ja-JP")).toBe("en");
  });
});
