#!/usr/bin/env node
/**
 * Improvement registry status.
 * Usage: npm run improve:status
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = join(root, 'docs', 'planning', 'improvements', 'registry.jsonl');

if (!existsSync(registry)) {
  console.log('No registry. Run: npm run improve:audit');
  process.exit(0);
}

const items = readFileSync(registry, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
const open = items.filter((i) => i.status === 'open');
const done = items.filter((i) => i.status === 'done');
const byPri = {};
for (const i of open) byPri[i.priority] = (byPri[i.priority] ?? 0) + 1;

console.log('═══ Improvement Registry ═══\n');
console.log(`Total: ${items.length} · Open: ${open.length} · Done: ${done.length}`);
console.log('\nOpen by priority:');
for (const p of ['P0', 'P1', 'P2', 'P3']) {
  if (byPri[p]) console.log(`  ${p}: ${byPri[p]}`);
}
console.log('\nNext: npm run improve:next -- P0');