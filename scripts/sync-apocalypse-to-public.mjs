#!/usr/bin/env node
/**
 * Copies `static/apocalypse/` into `app/public/apocalypse/` for Vite/nginx.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "static", "apocalypse");
const dest = join(root, "app", "public", "apocalypse");

if (!existsSync(src)) {
  console.error("[sync-apocalypse] missing:", src);
  process.exit(1);
}

mkdirSync(join(root, "app", "public"), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[sync-apocalypse]", src, "->", dest);
