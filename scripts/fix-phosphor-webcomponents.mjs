import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
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
    re: /(?:\.\.\/)+node_modules\/\.pnpm\/@lit_reactive-element@[^/]+\/node_modules\/@lit\/reactive-element\/([^"']+)\.mjs/g,
    to: "@lit/reactive-element/$1.js",
  },
  {
    re: /(?:\.\.\/)+@lit_reactive-element@[^/]+\/node_modules\/@lit\/reactive-element\/([^"']+)\.mjs/g,
    to: "@lit/reactive-element/$1.js",
  },
  {
    re: /(?:\.\.\/)+node_modules\/\.pnpm\/lit-html@[^/]+\/node_modules\/lit-html\/([^"']+)\.mjs/g,
    to: "lit-html/$1.js",
  },
  {
    re: /(?:\.\.\/)+lit-html@[^/]+\/node_modules\/lit-html\/([^"']+)\.mjs/g,
    to: "lit-html/$1.js",
  },
  {
    re: /(?:\.\.\/)+node_modules\/\.pnpm\/lit-element@[^/]+\/node_modules\/lit-element\/([^"']+)\.mjs/g,
    to: "lit-element/$1.js",
  },
  {
    re: /(?:\.\.\/)+lit-element@[^/]+\/node_modules\/lit-element\/([^"']+)\.mjs/g,
    to: "lit-element/$1.js",
  },
  {
    re: /\.\.\/(@lit\/reactive-element\/)/g,
    to: "$1",
  },
  {
    re: /\.\.\/(lit-html\/)/g,
    to: "$1",
  },
  {
    re: /\.\.\/(lit-element\/)/g,
    to: "$1",
  },
];

const iconsDir = join(distRoot, "icons");
const fallbackIcon = join(iconsDir, "PhCircle.mjs");
const appkitIconsFile = join(root, "node_modules", "@reown", "appkit-ui", "dist", "esm", "src", "components", "wui-icon", "index.js");

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const { re, to } of rewrites) after = after.replace(re, to);
  if (after !== before) {
    writeFileSync(file, after, "utf8");
    changedFiles += 1;
  }
}

function ensureStubIcon(name) {
  const target = join(iconsDir, `${name}.mjs`);
  if (existsSync(target)) return false;
  if (!existsSync(fallbackIcon)) return false;
  mkdirSync(dirname(target), { recursive: true });
  const base = name.startsWith("Ph") ? name.slice(2) : name;
  const tag = `ph-${base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
  const contents = `import { PhCircle } from "./PhCircle.mjs";\nif (!customElements.get(${JSON.stringify(tag)})) customElements.define(${JSON.stringify(tag)}, PhCircle);\nexport { PhCircle as ${name} };\n`;
  writeFileSync(target, contents, "utf8");
  return true;
}

let createdStubs = 0;
if (existsSync(appkitIconsFile) && existsSync(iconsDir)) {
  const s = readFileSync(appkitIconsFile, "utf8");
  const re = /@phosphor-icons\/webcomponents\/(Ph[0-9A-Za-z]+)/g;
  const needed = new Set();
  let m;
  while ((m = re.exec(s))) needed.add(m[1]);
  for (const name of needed) if (ensureStubIcon(name)) createdStubs += 1;
}

if (changedFiles > 0) {
  console.log(`[fix-phosphor] patched ${changedFiles} files under ${distRoot}`);
}

if (createdStubs > 0) {
  console.log(`[fix-phosphor] created ${createdStubs} stub icons under ${iconsDir}`);
}
