import { describe, it, expect } from "vitest";
import translations, { type LangCode, type Translations } from "../i18n/translations";
import { SUPPORTED_LANGS } from "../hooks/useLanguage";
import { hasBalancedSimpleBoldMarkers } from "../lib/renderSimpleBold";

/**
 * Recursively collect all dot-separated leaf key paths from a nested object.
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
 * Retrieve a nested value using a dot-separated key path.
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc !== null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      obj
    );
}

const referenceLang: LangCode = "en";
const referenceKeys = collectKeys(
  translations[referenceLang] as unknown as Record<string, unknown>
);

describe("translations — language coverage", () => {
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
});

describe("translations — key completeness", () => {
  for (const lang of SUPPORTED_LANGS) {
    describe(`language: ${lang}`, () => {
      const entry = translations[lang] as unknown as Record<string, unknown>;

      it(`has all ${referenceKeys.length} keys from the reference (${referenceLang}) translation`, () => {
        const missing: string[] = [];
        for (const key of referenceKeys) {
          if (getValueByPath(entry, key) === undefined) missing.push(key);
        }
        expect(missing).toEqual([]);
      });

      it("has no null or undefined values", () => {
        const nullish: string[] = [];
        for (const key of referenceKeys) {
          const value = getValueByPath(entry, key);
          if (value === undefined || value === null) nullish.push(key);
        }
        expect(nullish).toEqual([]);
      });

      it("has no empty string values", () => {
        const empty: string[] = [];
        for (const key of referenceKeys) {
          const value = getValueByPath(entry, key);
          if (typeof value === "string" && value.trim() === "") empty.push(key);
        }
        expect(empty).toEqual([]);
      });

      it("all values are strings (or string arrays for chip lists)", () => {
        for (const key of referenceKeys) {
          const value = getValueByPath(entry, key);
          if (Array.isArray(value)) {
            expect(
              value.every((v) => typeof v === "string" && v.trim().length > 0),
              `'${lang}.${key}' should be a non-empty string[]`
            ).toBe(true);
          } else {
            expect(typeof value, `'${lang}.${key}' should be a string`).toBe("string");
          }
        }
      });
    });
  }
});

describe("translations — key symmetry", () => {
  it("every language contains exactly the same keys as English", () => {
    const enKeys = collectKeys(
      translations.en as unknown as Record<string, unknown>
    ).sort();

    for (const lang of SUPPORTED_LANGS) {
      const langKeys = collectKeys(
        translations[lang] as unknown as Record<string, unknown>
      ).sort();
      expect(langKeys, `${lang} keys do not match English keys`).toEqual(enKeys);
    }
  });
});

describe("translations — specific content", () => {
  it("English tagline references Cetățuia", () => {
    expect(translations.en.hero.tagline).toContain("Cetățuia");
  });

  it("buy button text is non-empty for all languages", () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(translations[lang].hero.buyNow.trim().length).toBeGreaterThan(0);
    }
  });

  it("nav section has all expected keys for every language", () => {
    const expectedNavKeys: Array<keyof Translations["nav"]> = [
      "home",
      "cetApp",
      "tokenomics",
      "roadmap",
      "team",
      "howToBuy",
      "whitepaper",
      "resources",
      "faq",
      "competition",
      "buyOnDedust",
      "sheetDescription",
      "openMenu",
      "primaryNavigation",
      "opensInNewWindow",
    ];
    for (const lang of SUPPORTED_LANGS) {
      for (const key of expectedNavKeys) {
        expect(
          translations[lang].nav[key],
          `${lang}.nav.${key} missing`
        ).toBeTruthy();
      }
    }
  });

  it("hero section has all expected keys for every language", () => {
    const expectedHeroKeys: Array<keyof Translations["hero"]> = [
      "tagline",
      "subtitle",
      "buyNow",
      "learnMore",
      "description",
      "startMining",
      "docs",
      "miningStartAria",
      "miningProcessingAria",
      "miningSuccessAria",
      "liveTickerAria",
      "nextStepsLabel",
      "nextStepBuy",
      "nextStepTokenomics",
      "nextStepHowToBuy",
    ];
    for (const lang of SUPPORTED_LANGS) {
      for (const key of expectedHeroKeys) {
        expect(
          translations[lang].hero[key],
          `${lang}.hero.${key} missing`
        ).toBeTruthy();
      }
    }
  });

  it("footerNav has all expected keys for every language", () => {
    const expectedFooterNavKeys: Array<keyof Translations["footerNav"]> = [
      "privacy",
      "terms",
      "contact",
      "authorityTrust",
      "sovereignNoJs",
      "github",
    ];
    for (const lang of SUPPORTED_LANGS) {
      for (const key of expectedFooterNavKeys) {
        expect(
          translations[lang].footerNav[key],
          `${lang}.footerNav.${key} missing`
        ).toBeTruthy();
      }
    }
  });

  it("tokenomics section has all expected keys for every language", () => {
    const expectedTokenomicsKeys: Array<keyof Translations["tokenomics"]> = [
      "title",
      "supply",
      "poolAddress",
      "subtitle",
      "fixedSupply",
      "ravProtocol",
      "ravStack",
      "btcSReference",
      "cetCapLabel",
    ];
    for (const lang of SUPPORTED_LANGS) {
      for (const key of expectedTokenomicsKeys) {
        expect(
          translations[lang].tokenomics[key],
          `${lang}.tokenomics.${key} missing`
        ).toBeTruthy();
      }
    }
  });
});

describe("translations — authorityTrust ** markers for renderSimpleBold", () => {
  const pillarBodyKeys: Array<keyof Translations["authorityTrust"]> = [
    "pillar1Body",
    "pillar2Body",
    "pillar3Body",
    "pillar4Body",
  ];

  for (const lang of SUPPORTED_LANGS) {
    it(`${lang}: pillar bodies have balanced ** delimiters`, () => {
      const at = translations[lang].authorityTrust;
      for (const key of pillarBodyKeys) {
        const body = at[key];
        expect(
          hasBalancedSimpleBoldMarkers(body),
          `${lang}.authorityTrust.${key}: ${JSON.stringify(body.slice(0, 80))}…`
        ).toBe(true);
      }
    });
  }
});
