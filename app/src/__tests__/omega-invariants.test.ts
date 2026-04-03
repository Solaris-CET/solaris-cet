import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN_CDN_PATTERNS = [
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /cdn\.jsdelivr\.net/i,
  /unpkg\.com/i,
  /cdnjs\.cloudflare\.com/i,
  /cdn\.tailwindcss\.com/i,
];

describe("OMEGA invariants", () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const sovereignHtml = readFileSync(join(repoRoot, "static/sovereign/index.html"), "utf8");
  const appIndexHtml = readFileSync(join(repoRoot, "app/index.html"), "utf8");

  it("sovereign: no scripts, no forbidden CDNs; canonical CET/TON/Cetățuia copy", () => {
    expect(sovereignHtml).not.toMatch(/<script\b/i);
    for (const pattern of FORBIDDEN_CDN_PATTERNS) {
      expect(sovereignHtml).not.toMatch(pattern);
      expect(appIndexHtml).not.toMatch(pattern);
    }
    expect(sovereignHtml).toMatch(/9,000\s*CET/i);
    expect(sovereignHtml).toMatch(/\bTON\b/i);
    expect(sovereignHtml).toMatch(/Cetățuia,\s*Romania/i);
  });

  it("app index: noscript read-only fallback links to /sovereign/; TMA host marker after DOMContentLoaded", () => {
    expect(appIndexHtml).toContain("solaris-noscript-fallback");
    expect(appIndexHtml).toContain('href="/sovereign/"');
    expect(appIndexHtml).toContain("tma-host");
    expect(appIndexHtml).toContain("DOMContentLoaded");
  });

  it("app index: no third-party analytics hosts in CSP (sovereignty / privacy posture)", () => {
    expect(appIndexHtml).not.toMatch(/plausible\.io/i);
  });
});
