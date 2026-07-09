#!/usr/bin/env node
/**
 * HARD-009 — Graphify-powered related code suggestions.
 * Usage: npm run graphify:suggest -- "twin stream"
 */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const topic = process.argv.slice(2).join(' ') || 'SOLARIS CET';
const graphJson = join(root, 'graphify-out', 'graph.json');
const PYTHON = process.env.GRAPHIFY_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const MAX_SUGGESTIONS = 8;

function runGraphify(args) {
  const r = spawnSync(PYTHON, ['-m', 'graphify', ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  return {
    ok: r.status === 0,
    out: `${r.stdout || ''}${r.stderr || ''}`.trim(),
  };
}

function parseSuggestions(output) {
  const seen = new Set();
  const suggestions = [];
  for (const line of output.split('\n')) {
    const match = line.match(/^NODE\s+.+?\s+\[src=([^\s\]]+)/);
    if (!match) continue;
    const src = match[1].replace(/\\/g, '/');
    if (seen.has(src)) continue;
    seen.add(src);
    suggestions.push(src);
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }
  return suggestions;
}

if (!existsSync(graphJson)) {
  console.error('graphify-out/graph.json missing — run: npm run graphify:build');
  process.exit(1);
}

const query = runGraphify(['query', topic, '--budget', '1200']);
if (!query.ok) {
  console.error(query.out.slice(-800));
  process.exit(1);
}

const files = parseSuggestions(query.out);
const result = { topic, files, count: files.length };

console.log(JSON.stringify(result, null, 2));
console.log('\n── Suggested files to read/touch ──');
files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));