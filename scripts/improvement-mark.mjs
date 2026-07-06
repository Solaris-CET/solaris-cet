#!/usr/bin/env node
/**
 * Mark improvement item done in registry.jsonl.
 * Usage: node scripts/improvement-mark.mjs IMP-00042
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const id = process.argv[2]?.trim();
if (!id) {
  console.error('Usage: node scripts/improvement-mark.mjs IMP-00001');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = join(root, 'docs', 'planning', 'improvements', 'registry.jsonl');
const lines = readFileSync(registry, 'utf8').trim().split(/\r?\n/);
let found = false;
const out = lines.map((line) => {
  if (!line.trim()) return line;
  const o = JSON.parse(line);
  if (o.id === id) {
    found = true;
    return JSON.stringify({ ...o, status: 'done', done_at: new Date().toISOString().slice(0, 10) });
  }
  return line;
});
if (!found) {
  console.error(`Not found: ${id}`);
  process.exit(1);
}
writeFileSync(registry, out.join('\n') + '\n', 'utf8');
console.log(`✓ ${id} marked done`);