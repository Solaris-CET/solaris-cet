#!/usr/bin/env node
/**
 * Loop 0b — Graphify prime: ensure codebase map exists + print orientation.
 * Usage: npm run graphify:prime
 *        npm run graphify:prime -- "survey admin auth"
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const topic = process.argv.slice(2).join(' ') || 'SOLARIS CET architecture';
const graphDir = join(root, 'graphify-out');
const graphJson = join(graphDir, 'graph.json');
const report = join(graphDir, 'GRAPH_REPORT.md');
const wikiIndex = join(graphDir, 'wiki', 'index.md');

const PYTHON =
  process.env.GRAPHIFY_PYTHON ||
  (process.platform === 'win32' ? 'python' : 'python3');

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

console.log('═══ SOLARIS CET — Graphify Prime ═══\n');

if (!existsSync(graphJson)) {
  console.log('⚠ graphify-out/graph.json missing — building code-only map (no LLM)…\n');
  const buildRun = spawnSync(process.execPath, ['scripts/graphify-build.mjs'], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
  });
  const build = {
    ok: buildRun.status === 0,
    out: `${buildRun.stdout || ''}${buildRun.stderr || ''}`.trim(),
  };
  if (!build.ok) {
    console.error(build.out.slice(-1200));
    console.error('\n✗ graphify build failed — install: python -m pip install graphifyy');
    process.exit(1);
  }
  console.log('✓ Code graph built\n');
} else {
  console.log('✓ graphify-out/graph.json present\n');
}

if (existsSync(report)) {
  const lines = readFileSync(report, 'utf8').split('\n').slice(0, 24);
  console.log('── GRAPH_REPORT (excerpt) ──');
  console.log(lines.join('\n'));
  console.log('');
}

if (existsSync(wikiIndex)) {
  console.log(`── Wiki index: graphify-out/wiki/index.md ──\n`);
}

const query = runGraphify(['query', topic, '--budget', '1200']);
if (query.ok) {
  console.log(`── graphify query "${topic}" ──`);
  console.log(query.out.slice(0, 2500));
} else {
  console.log(`(query skipped: ${query.out.slice(-400)})`);
}

console.log('\n── Agent commands ──');
console.log('  python -m graphify query "<question>"');
console.log('  python -m graphify path "<A>" "<B>"');
console.log('  python -m graphify explain "<concept>"');
console.log('  python -m graphify update .   # after code edits (AST-only)');