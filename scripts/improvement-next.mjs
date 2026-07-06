#!/usr/bin/env node
/**
 * Pick next open improvement from registry.jsonl (Ralph-style).
 * Usage: npm run improve:next
 *        npm run improve:next -- P0
 *        npm run improve:next -- survey
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = join(root, 'docs', 'planning', 'improvements', 'registry.jsonl');
const filter = process.argv.slice(2).join(' ').trim();

if (!existsSync(registry)) {
  console.error('Registry missing. Run: npm run improve:audit');
  process.exit(1);
}

const lines = readFileSync(registry, 'utf8').trim().split(/\r?\n/).filter(Boolean);
const items = lines.map((l) => JSON.parse(l));

let pick = null;
let pickIdx = -1;
for (let i = 0; i < items.length; i += 1) {
  const it = items[i];
  if (it.status !== 'open') continue;
  if (filter) {
    if (/^P[0-3]$/.test(filter) && it.priority !== filter) continue;
    else if (!/^P[0-3]$/.test(filter)) {
      const hay = `${it.category} ${it.path} ${it.dimension}`.toLowerCase();
      if (!hay.includes(filter.toLowerCase())) continue;
    }
  }
  pick = it;
  pickIdx = i;
  break;
}

if (!pick) {
  console.log(filter ? `No open improvements matching: ${filter}` : 'All improvements done.');
  process.exit(0);
}

console.log('═══ Next Improvement ═══\n');
console.log(`ID:       ${pick.id}`);
console.log(`Priority: ${pick.priority}`);
console.log(`Category: ${pick.category}`);
console.log(`Dimension:${pick.dimension}`);
console.log(`Path:     ${pick.path}`);
console.log('\n── Rule of 3 ──');
console.log('  1. Memory — read path + HANDOFF if ops');
console.log('  2. Build  — surgical fix + test');
console.log('  3. Verify — npm run improve:verify');
console.log(`\nMark done: node scripts/improvement-mark.mjs ${pick.id}`);
process.exit(0);