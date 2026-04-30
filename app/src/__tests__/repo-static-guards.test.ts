import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect,it } from "vitest";

import {
  OG_IMAGE_FILENAME,
  PRODUCTION_SITE_ORIGIN,
  productionBrandLogoUrl,
  productionOgImageUrl,
  productionSiteUrl,
  productionTonConnectIconUrl,
  SOLARIS_CET_LOGO_FILENAME,
} from "@/lib/brandAssets";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const appPublic = join(repoRoot, "app/public");

const FORBIDDEN_CDN_PATTERNS = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /cdn\.jsdelivr\.net/i,
  /unpkg\.com/i,
  /cdnjs\.cloudflare\.com/i,
  /cdn\.tailwindcss\.com/i,
];

describe("Public discovery — sitemap, security.txt, humans.txt", () => {
  it("static assets ship with expected content", () => {
    const xml = readFileSync(join(appPublic, "sitemap.xml"), "utf8");
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/apocalypse/`);
    expect(xml).toContain(`${PRODUCTION_SITE_ORIGIN}/sovereign/`);

    const sec = join(appPublic, ".well-known/security.txt");
    expect(existsSync(sec), "public/.well-known/security.txt must ship").toBe(true);
    const secBody = readFileSync(sec, "utf8");
    expect(secBody).toMatch(/Contact:\s*https:\/\/t\.me\/SolarisCET/);
    expect(secBody).toContain("Preferred-Languages:");
    expect(secBody).toMatch(/^Expires:\s/m);

    const hum = join(appPublic, "humans.txt");
    expect(existsSync(hum), "public/humans.txt must ship").toBe(true);
    const humBody = readFileSync(hum, "utf8");
    expect(humBody).toContain(productionSiteUrl());
    expect(humBody).toContain("github.com/Solaris-CET");
  });
});

describe("OMEGA sovereign — self-hosted JetBrains Mono", () => {
  const fontPath = join(repoRoot, "static/sovereign/fonts/jetbrains-mono-400.woff2");

  it("woff2 exists under static/sovereign/fonts/", () => {
    expect(existsSync(fontPath), `missing ${fontPath}`).toBe(true);
    expect(statSync(fontPath).size).toBeGreaterThan(1000);
  });
});

describe("Brand raster — SolarisLogoMark source of truth", () => {
  const logoPath = join(appPublic, SOLARIS_CET_LOGO_FILENAME);

  it("brand logo raster ships in app/public (referenced by SolarisLogoMark)", () => {
    expect(existsSync(logoPath), `missing ${logoPath}`).toBe(true);
    expect(statSync(logoPath).size).toBeGreaterThan(5000);
  });

  it("index.html Organization JSON-LD logo URL matches productionBrandLogoUrl()", () => {
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    expect(appIndexHtml).toContain(productionBrandLogoUrl());
  });
});

describe("Social preview — og-image raster", () => {
  const ogPath = join(appPublic, OG_IMAGE_FILENAME);

  it("og-image ships in app/public; meta URLs match productionOgImageUrl()", () => {
    expect(existsSync(ogPath), `missing ${ogPath}`).toBe(true);
    expect(statSync(ogPath).size).toBeGreaterThan(1000);
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    const og = productionOgImageUrl();
    expect(appIndexHtml).toContain(`property="og:image" content="${og}"`);
    expect(appIndexHtml).toContain(`name="twitter:image" content="${og}"`);
    expect(appIndexHtml).toContain(`"image": "${og}"`);
  });
});

describe("index.html — canonical production site URL", () => {
  it("og:url, twitter:url, canonical link, and JSON-LD url fields use productionSiteUrl()", () => {
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    const site = productionSiteUrl();
    const canonical = `${site}/en/`;
    expect(appIndexHtml).toContain(`property="og:url" content="${canonical}"`);
    expect(appIndexHtml).toContain(`name="twitter:url" content="${canonical}"`);
    expect(appIndexHtml).toContain(`rel="canonical" href="${canonical}"`);
    expect(appIndexHtml).toContain(`"url": "${site}"`);
  });
});

describe("index.html — critical image preloads for LCP", () => {
  it("preloads Solaris brand raster and hero coin", () => {
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    const escapedLogo = SOLARIS_CET_LOGO_FILENAME.replace(/\./g, "\\.");
    expect(appIndexHtml).toMatch(new RegExp(`rel="preload"[^>]+${escapedLogo}`, "s"));
    expect(appIndexHtml).toMatch(/rel="preload"[^>]+hero-coin\.png/s);
  });
});

describe("PWA manifest.json — icon paths resolve on disk", () => {
  it("icons and shortcut icons reference files under app/public", () => {
    const raw = readFileSync(join(appPublic, "manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as {
      icons?: readonly { src?: string }[];
      shortcuts?: readonly { icons?: readonly { src?: string }[] }[];
    };
    const relPaths = new Set<string>();
    for (const icon of manifest.icons ?? []) {
      const s = icon.src;
      if (s?.startsWith("/")) relPaths.add(s.slice(1));
    }
    for (const sc of manifest.shortcuts ?? []) {
      for (const ic of sc.icons ?? []) {
        const s = ic.src;
        if (s?.startsWith("/")) relPaths.add(s.slice(1));
      }
    }
    for (const rel of relPaths) {
      const abs = join(appPublic, rel);
      expect(existsSync(abs), `manifest.json references missing file: /${rel}`).toBe(true);
    }
  });

  it("main PWA icons use square icon-192/icon-512, not hero-coin", () => {
    const raw = readFileSync(join(appPublic, "manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as { icons?: readonly { src?: string }[] };
    const main = manifest.icons ?? [];
    expect(main.length).toBeGreaterThanOrEqual(2);
    for (const icon of main) {
      expect(icon.src).toBeDefined();
      expect(icon.src).not.toMatch(/hero-coin/i);
      expect(icon.src).toMatch(/icon-(192|512)\.png/);
    }
  });
});

describe("TON Connect manifest — brand icon URL", () => {
  it("iconUrl uses square icon-192.png (not portrait lockup); url matches productionSiteUrl", () => {
    const raw = readFileSync(join(appPublic, "tonconnect-manifest.json"), "utf8");
    const j = JSON.parse(raw) as { iconUrl?: string; url?: string };
    expect(j.iconUrl).toBe(productionTonConnectIconUrl());
    expect(j.iconUrl).not.toBe(productionBrandLogoUrl());
    expect(j.url).toBe(productionSiteUrl());
  });
});

describe("OMEGA invariants", () => {
  it("sovereign: no scripts, no forbidden CDNs; canonical CET/TON/Cetățuia copy", () => {
    const sovereignHtml = readFileSync(join(repoRoot, "static/sovereign/index.html"), "utf8");
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");

    expect(sovereignHtml).not.toMatch(/<script\b/i);
    for (const pattern of FORBIDDEN_CDN_PATTERNS) {
      expect(sovereignHtml).not.toMatch(pattern);
      expect(appIndexHtml).not.toMatch(pattern);
    }
    expect(sovereignHtml).toMatch(/9,000\s*CET/i);
    expect(sovereignHtml).toMatch(/\bTON\b/i);
    expect(sovereignHtml).toMatch(/Cetățuia,\s*Romania/i);
  });
});
