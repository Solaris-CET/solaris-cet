#!/usr/bin/env node
/**
 * Build merged codebase graph at graphify-out/graph.json (code-only, no LLM).
 * Usage: npm run graphify:build
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'graphify-out');
const graphJson = join(outDir, 'graph.json');
const PYTHON = process.env.GRAPHIFY_PYTHON || 'python';

const CODE_ROOTS = [
  'survey-engine/src',
  'app/api',
  'app/src',
  'scripts',
  'contracts',
];

function run(args, { cwd = root } = {}) {
  const r = spawnSync(PYTHON, ['-m', 'graphify', ...args], {
    cwd,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  return {
    ok: r.status === 0,
    out: `${r.stdout || ''}${r.stderr || ''}`.trim(),
  };
}

console.log('═══ Graphify build (code-only) ═══\n');

// Prefer full-repo extract when .graphifyignore strips docs (fastest, one graph).
const full = run(['extract', '.', '--no-cluster', '--no-viz', '--out', root]);
if (full.ok && existsSync(graphJson)) {
  console.log(full.out.split('\n').slice(-3).join('\n'));
  console.log(`\n✓ graph at ${graphJson}`);
  process.exit(0);
}

console.log('Full extract failed — merging per-package graphs…\n');
if (full.out) console.log(full.out.slice(-600));

const partials = [];
for (const rel of CODE_ROOTS) {
  const abs = join(root, rel);
  if (!existsSync(abs)) continue;
  console.log(`→ extract ${rel}`);
  const res = run(['extract', rel, '--no-cluster', '--no-viz']);
  const partial = join(abs, 'graphify-out', 'graph.json');
  if (res.ok && existsSync(partial)) {
    partials.push(partial);
    console.log(`  ✓ ${partial}`);
  } else {
    console.log(`  ⚠ skip (${res.out.slice(-200)})`);
  }
}

if (!partials.length) {
  console.error('\n✗ No partial graphs produced. Install: python -m pip install graphifyy');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const merge = run(['merge-graphs', ...partials, '--out', graphJson]);
if (!merge.ok || !existsSync(graphJson)) {
  console.error(merge.out.slice(-800));
  process.exit(1);
}

// Drop nested graphify-out dirs (keep root canonical copy)
for (const rel of CODE_ROOTS) {
  const nested = join(root, rel, 'graphify-out');
  if (existsSync(nested)) rmSync(nested, { recursive: true, force: true });
}

console.log(`\n✓ merged graph at ${graphJson} (${partials.length} parts)`);