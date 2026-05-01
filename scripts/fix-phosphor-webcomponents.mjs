import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distRoot = join(root, "node_modules", "@phosphor-icons", "webcomponents", "dist");

if (!existsSync(distRoot)) {
  process.exit(0);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walk(abs, out);
      continue;
    }
    if (st.isFile() && abs.endsWith(".mjs")) out.push(abs);
  }
  return out;
}

const files = walk(distRoot);
let changedFiles = 0;

const rewrites = [
  {
    re: /node_modules\/\.pnpm\/@lit_reactive-element@[^/]+\/node_modules\/@lit\/reactive-element\/([^"']+)\.mjs/g,
    to: "@lit/reactive-element/$1.js",
  },
  {
    re: /node_modules\/\.pnpm\/lit-html@[^/]+\/node_modules\/lit-html\/([^"']+)\.mjs/g,
    to: "lit-html/$1.js",
  },
  {
    re: /node_modules\/\.pnpm\/lit-element@[^/]+\/node_modules\/lit-element\/([^"']+)\.mjs/g,
    to: "lit-element/$1.js",
  },
];

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const { re, to } of rewrites) after = after.replace(re, to);
  if (after !== before) {
    writeFileSync(file, after, "utf8");
    changedFiles += 1;
  }
}

if (changedFiles > 0) {
  console.log(`[fix-phosphor] patched ${changedFiles} files under ${distRoot}`);
}

