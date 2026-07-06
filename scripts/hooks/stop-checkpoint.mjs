#!/usr/bin/env node
/**
 * Claude Code Stop hook — remind agent to checkpoint + stash:sync if tasks open.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const featuresRoot = join(root, 'docs', 'planning', 'features');

let open = 0;
if (existsSync(featuresRoot)) {
  for (const d of readdirSync(featuresRoot, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === '_template') continue;
    const f = join(featuresRoot, d.name, 'tasks.md');
    if (!existsSync(f)) continue;
    const n = (readFileSync(f, 'utf8').match(/^- \[ \]/gm) ?? []).length;
    open += n;
  }
}

if (open > 0) {
  console.log(`[loops] ${open} open task(s) — run: npm run loops:next → finish → stash:sync`);
}
process.exit(0);