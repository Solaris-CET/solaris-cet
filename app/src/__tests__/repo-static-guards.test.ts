import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const appPublic = join(dirname(fileURLToPath(import.meta.url)), "../../public");

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
    expect(xml).toContain("https://solaris-cet.com/apocalypse/");
    expect(xml).toContain("https://solaris-cet.com/sovereign/");

    const sec = join(appPublic, ".well-known/security.txt");
    expect(existsSync(sec), "public/.well-known/security.txt must ship").toBe(true);
    const secBody = readFileSync(sec, "utf8");
    expect(secBody).toMatch(/Contact:\s*https:\/\/t\.me\/SolarisCET/);
    expect(secBody).toContain("Preferred-Languages:");
    expect(secBody).toMatch(/^Expires:\s/m);

    const hum = join(appPublic, "humans.txt");
    expect(existsSync(hum), "public/humans.txt must ship").toBe(true);
    const humBody = readFileSync(hum, "utf8");
    expect(humBody).toContain("https://solaris-cet.com/");
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
  const logoPath = join(appPublic, "solaris-cet-logo.jpg");

  it("solaris-cet-logo.jpg ships in app/public (referenced by SolarisLogoMark)", () => {
    expect(existsSync(logoPath), `missing ${logoPath}`).toBe(true);
    expect(statSync(logoPath).size).toBeGreaterThan(5000);
  });
});

describe("Social preview — og-image raster", () => {
  const ogPath = join(appPublic, "og-image.png");

  it("og-image.png ships in app/public (og/twitter meta + JSON-LD)", () => {
    expect(existsSync(ogPath), `missing ${ogPath}`).toBe(true);
    expect(statSync(ogPath).size).toBeGreaterThan(1000);
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    expect(appIndexHtml).toContain("og-image.png");
  });
});

describe("index.html — critical image preloads for LCP", () => {
  it("preloads Solaris brand raster and hero coin", () => {
    const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");
    expect(appIndexHtml).toMatch(/rel="preload"[^>]+solaris-cet-logo\.jpg/s);
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
  it("iconUrl references shipped solaris-cet-logo.jpg", () => {
    const raw = readFileSync(join(appPublic, "tonconnect-manifest.json"), "utf8");
    const j = JSON.parse(raw) as { iconUrl?: string };
    expect(j.iconUrl).toMatch(/solaris-cet-logo\.jpg$/);
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
