/**
 * Pure language-detection + translation smoke (no React hook mount).
 */

import { describe, expect,it } from "vitest";

import { SUPPORTED_LANGS } from "../hooks/useLanguage";
import type { LangCode } from "../i18n/translations";
import translations from "../i18n/translations";

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

describe("useLanguage (pure)", () => {
  it("SUPPORTED_LANGS, detectLanguage matrix, translations parity, storage sim", () => {
    expect(SUPPORTED_LANGS).toEqual(["en", "ro", "de", "es", "pt", "ru", "zh"]);
    expect(detectLanguage("es", "en-US")).toBe("es");
    expect(detectLanguage("fr", "zh-CN")).toBe("zh");
    expect(detectLanguage(null, "fr-FR")).toBe("en");
    expect(detectLanguage(null, "zh-CN")).toBe("zh");
    expect(detectLanguage(null, "unknown")).toBe("en");
    expect(detectLanguage("ru", "es-MX")).toBe("ru");
    expect(detectLanguage("ro", "en-US")).toBe("ro");
    expect(detectLanguage(null, "ru-RU")).toBe("ru");
    expect(detectLanguage("fr", "ja-JP")).toBe("en");

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
