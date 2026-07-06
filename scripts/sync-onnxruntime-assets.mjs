#!/usr/bin/env node
/**
 * Copies ONNX Runtime Web distribution assets into app/public so the worker
 * can load WASM binaries from same-origin paths (CSP-compliant, no CDN).
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
// Try app/node_modules (old structure) or root node_modules (new workspace structure)
let src = join(root, "app", "node_modules", "onnxruntime-web", "dist");
if (!existsSync(src)) {
  src = join(root, "node_modules", "onnxruntime-web", "dist");
}
const dest = join(root, "app", "public", "vendor", "onnxruntime");

if (!existsSync(src)) {
  console.error("[sync-onnxruntime] missing:", src);
  process.exit(1);
}

mkdirSync(dest, { recursive: true });

// Keep only runtime files needed by ort.env.wasm.wasmPaths.
// Use "ort-wasm" (no trailing dash) so we match ort-wasm.wasm / ort-wasm.js and ort-wasm-simd-*.
const requiredPrefixes = ["ort-wasm", "ort.webgpu", "ort.wasm"];
const requiredSuffixes = [".wasm", ".mjs", ".js"];

const files = readdirSync(src).filter((name) => {
  const hasPrefix = requiredPrefixes.some((prefix) => name.startsWith(prefix));
  const hasSuffix = requiredSuffixes.some((suffix) => name.endsWith(suffix));
  return hasPrefix && hasSuffix;
});

if (files.length === 0) {
  console.error("[sync-onnxruntime] no runtime assets found in", src);
  process.exit(1);
}

for (const file of files) {
  cpSync(join(src, file), join(dest, file));
}

console.log("[sync-onnxruntime]", src, "→", dest, `(${files.length} files)`);
