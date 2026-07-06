#!/usr/bin/env node
/**
 * Mark improvements done by filter.
 * Usage: node scripts/improvement-mark-batch.mjs --path app/package.json
 *        node scripts/improvement-mark-batch.mjs --dimension windows-safe
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = join(root, 'docs', 'planning', 'improvements', 'registry.jsonl');
const pathFilter = process.argv.find((a) => a.startsWith('--path='))?.slice(7);
const dimFilter = process.argv.find((a) => a.startsWith('--dimension='))?.slice(12);
const catFilter = process.argv.find((a) => a.startsWith('--category='))?.slice(11);

const lines = readFileSync(registry, 'utf8').trim().split(/\r?\n/);
let n = 0;
const out = lines.map((line) => {
  if (!line.trim()) return line;
  const o = JSON.parse(line);
  if (o.status === 'done') return line;
  if (pathFilter && !o.path.includes(pathFilter)) return line;
  if (dimFilter && o.dimension !== dimFilter) return line;
  if (catFilter && o.category !== catFilter) return line;
  n += 1;
  return JSON.stringify({ ...o, status: 'done', done_at: new Date().toISOString().slice(0, 10) });
});
writeFileSync(registry, out.join('\n') + '\n', 'utf8');
console.log(`✓ Marked ${n} items done`);