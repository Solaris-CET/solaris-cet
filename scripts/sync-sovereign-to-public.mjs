#!/usr/bin/env node
/**
 * Copies static/sovereign → app/public/sovereign so Vite production build
 * serves the OMEGA zero-JS surface at /sovereign/ (Coolify: same artifact as SPA).
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "static/sovereign");
const dest = join(root, "app/public/sovereign");

if (!existsSync(src)) {
  console.error("[sync-sovereign] missing:", src);
  process.exit(1);
}

/** OMEGA: @font-face in static/sovereign/index.html — build must fail if vendored woff2 is missing. */
const requiredFont = join(src, "fonts/jetbrains-mono-400.woff2");
if (!existsSync(requiredFont)) {
  console.error(
    "[sync-sovereign] missing self-hosted font (SIL OFL). Expected:",
    requiredFont
  );
  process.exit(1);
}

cpSync(src, dest, { recursive: true });

/** React app @font-face uses `/fonts/jetbrains-mono-400.woff2` — mirror from sovereign source of truth. */
const appFonts = join(root, "app/public/fonts");
mkdirSync(appFonts, { recursive: true });
cpSync(requiredFont, join(appFonts, "jetbrains-mono-400.woff2"));
console.log("[sync-sovereign]", src, "→", dest);
console.log("[sync-sovereign] app font →", join(appFonts, "jetbrains-mono-400.woff2"));
