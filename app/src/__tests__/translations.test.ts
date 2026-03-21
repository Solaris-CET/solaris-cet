import { describe, it, expect } from "vitest";
import translations, { type LangCode, type Translations } from "../i18n/translations";
import { SUPPORTED_LANGS } from "../hooks/useLanguage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect every leaf value from an object. */
function collectLeaves(obj: unknown, path = ""): Array<{ path: string; value: unknown }> {
  if (obj === null || typeof obj !== "object") {
    return [{ path, value: obj }];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, val]) =>
    collectLeaves(val, path ? `${path}.${key}` : key)
  );
}

/** Collect every leaf key path from the English translation (used as reference). */
const enLeafPaths = collectLeaves(translations.en).map((l) => l.path);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("translations completeness", () => {
  it("every SUPPORTED_LANG has an entry in the translations map", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations).toHaveProperty(lang as string);
    }
  });

  it("the translations map has no extra entries beyond SUPPORTED_LANGS", () => {
    const translationKeys = Object.keys(translations) as LangCode[];
    for (const key of translationKeys) {
      expect(SUPPORTED_LANGS).toContain(key);
    }
  });

  it.each(SUPPORTED_LANGS as string[])(
    'lang "%s" contains all keys present in the English reference',
    (lang) => {
      const langTranslations = translations[lang as LangCode] as Translations;
      const leaves = collectLeaves(langTranslations).map((l) => l.path);
      for (const path of enLeafPaths) {
        expect(leaves).toContain(path);
      }
    }
  );

  it.each(SUPPORTED_LANGS as string[])(
    'lang "%s" has no empty string values',
    (lang) => {
      const leaves = collectLeaves(translations[lang as LangCode] as Translations);
      for (const { path, value } of leaves) {
        expect(value, `Empty string at ${lang}.${path}`).not.toBe("");
      }
    }
  );

  it.each(SUPPORTED_LANGS as string[])(
    'lang "%s" has only string leaf values',
    (lang) => {
      const leaves = collectLeaves(translations[lang as LangCode] as Translations);
      for (const { path, value } of leaves) {
        expect(typeof value, `Non-string leaf at ${lang}.${path}`).toBe("string");
      }
    }
  );
});

describe("English (default) translations content", () => {
  const { en } = translations;

  it('en.nav.home is "Home"', () => {
    expect(en.nav.home).toBe("Home");
  });

  it('en.hero.buyNow is "Buy CET"', () => {
    expect(en.hero.buyNow).toBe("Buy CET");
  });

  it("en.tokenomics.supply is a non-empty string", () => {
    expect(en.tokenomics.supply).toBeTruthy();
  });

  it("en.hero.subtitle mentions the 9,000 CET supply figure", () => {
    expect(en.hero.subtitle).toMatch(/9[,.]?000/);
  });

  it("en.hero.subtitle mentions TON blockchain", () => {
    expect(en.hero.subtitle).toMatch(/TON/i);
  });
});

describe("nav section structure", () => {
  const NAV_KEYS: Array<keyof Translations["nav"]> = [
    "home",
    "cetApp",
    "tokenomics",
    "roadmap",
    "howToBuy",
    "whitepaper",
    "resources",
  ];

  it.each(SUPPORTED_LANGS as string[])(
    'lang "%s" nav section has all 7 required keys',
    (lang) => {
      const nav = translations[lang as LangCode].nav;
      for (const key of NAV_KEYS) {
        expect(nav).toHaveProperty(key);
        expect(nav[key]).toBeTruthy();
      }
    }
  );
});
