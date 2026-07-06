#!/usr/bin/env node
/**
 * Sync project memory docs to Stash (after Retrospective Loop 7).
 * Updates existing pages via edit-page; falls back to dated upload for new files.
 * Usage: npm run stash:sync
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Canonical Stash page IDs (from first upload). */
const STASH_PAGES = {
  'docs/planning/agent-memory.md': '8f084fff-c19e-4b8d-83b7-6a7e783ee63c',
  'docs/planning/grok.md': '517aca79-0fd7-4ae6-a047-1734fb7ce61c',
  'docs/planning/HANDOFF.md': null,
  '.claude/skills/solaris-perfect-loops/SKILL.md': '119ed9c3-ab71-43fa-a942-967559793bff',
};

const FILES = Object.keys(STASH_PAGES);

const STASH_EXE = join(
  process.env.LOCALAPPDATA ?? '',
  'Packages',
  'PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0',
  'LocalCache',
  'local-packages',
  'Python312',
  'Scripts',
  'stash.exe',
);

const bin = existsSync(STASH_EXE) ? STASH_EXE : 'stash';
const shell = bin === 'stash';

function run(args, input) {
  const r = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    input,
    shell,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    ok: r.status === 0,
    out: (r.stdout || '').trim(),
    err: (r.stderr || r.stdout || '').trim(),
  };
}

function parseUrl(jsonText) {
  try {
    const j = JSON.parse(jsonText);
    return j.app_url ?? j.id ?? 'ok';
  } catch {
    return 'updated';
  }
}

console.log('Syncing memory to Stash…\n');

let ok = 0;
let fail = 0;

for (const rel of FILES) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.log(`⊘ skip (missing): ${rel}`);
    continue;
  }

  const content = readFileSync(abs, 'utf8');
  const pageId = STASH_PAGES[rel];

  if (pageId) {
    const r = run(['files', 'edit-page', pageId, '--json'], content);
    if (r.ok) {
      console.log(`✓ ${rel} → ${parseUrl(r.out)} (edit)`);
      ok += 1;
      continue;
    }
    console.log(`⚠ edit failed for ${rel}: ${r.err.slice(0, 100)} — trying upload`);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const base = rel.split('/').pop()?.replace(/\.md$/, '') ?? 'doc';
  const dated = `${base}-${stamp}`;
  const r = run(['upload', abs, '--name', dated, '--json']);
  if (!r.ok) {
    console.log(`✗ ${rel}: ${r.err.slice(0, 120)}`);
    fail += 1;
    continue;
  }
  console.log(`✓ ${rel} → ${parseUrl(r.out)} (new)`);
  ok += 1;
}

console.log(`\nDone (${ok} ok, ${fail} fail). Next agent: npm run stash:prime`);
process.exit(fail > 0 ? 1 : 0);