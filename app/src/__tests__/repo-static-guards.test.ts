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
