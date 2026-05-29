import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect,it } from "vitest";

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

  it("sovereign: no scripts, no forbidden CDNs", () => {
    expect(sovereignHtml).not.toMatch(/<script\b/i);
    for (const pattern of FORBIDDEN_CDN_PATTERNS) {
      expect(sovereignHtml).not.toMatch(pattern);
      expect(appIndexHtml).not.toMatch(pattern);
    }
  });

  it("app index: noscript read-only fallback links to key pages (services/contact)", () => {
    expect(appIndexHtml).toContain("solaris-noscript-fallback");
    expect(appIndexHtml).toContain('href="/servicii"');
    expect(appIndexHtml).toContain('href="/contact"');
    expect(appIndexHtml).toContain('href="tel:+40769889721"');
    expect(appIndexHtml).toContain('href="mailto:solaris-cet@protonmail.com"');
  });

  it("app index: no third-party analytics hosts in CSP (sovereignty / privacy posture)", () => {
    expect(appIndexHtml).not.toMatch(/plausible\.io/i);
  });
});
