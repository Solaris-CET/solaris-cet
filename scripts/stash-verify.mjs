#!/usr/bin/env node
/**
 * Full Stash + loops verification (Loop 0 + Loop 3 smoke).
 * Usage: npm run stash:verify
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

const results = [];
let failures = 0;

function pass(label, detail = '') {
  results.push({ ok: true, label, detail });
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ''}`);
}

function fail(label, detail = '') {
  results.push({ ok: false, label, detail });
  console.log(`✗ ${label}${detail ? ` — ${detail}` : ''}`);
  failures += 1;
}

function warn(label, detail = '') {
  results.push({ ok: true, label, detail, warn: true });
  console.log(`⚠ ${label}${detail ? ` — ${detail}` : ''}`);
}

function stashRun(args) {
  const r = spawnSync(bin, args, { cwd: root, encoding: 'utf8', shell, windowsHide: true });
  return { ok: r.status === 0, out: (r.stdout || r.stderr || '').trim() };
}

function runNode(script, args = []) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [join(root, 'scripts', script), ...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let out = '';
    child.stdout?.on('data', (d) => { out += d; });
    child.stderr?.on('data', (d) => { out += d; });
    child.on('close', (code) => resolvePromise({ ok: code === 0, out }));
  });
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text: text.slice(0, 80) };
  } catch (e) {
    return { ok: false, status: 0, text: e.message };
  }
}

console.log('═══ SOLARIS CET — Stash + Loops Verify ═══\n');

// Local files
for (const f of [
  'docs/planning/agent-memory.md',
  'docs/planning/grok.md',
  'docs/planning/global.md',
  '.claude/skills/solaris-perfect-loops/SKILL.md',
  'scripts/stash-prime.mjs',
  'scripts/stash-sync.mjs',
  'scripts/dev-local.mjs',
]) {
  if (existsSync(join(root, f))) pass(`file ${f}`);
  else fail(`file ${f}`, 'missing');
}

if (existsSync(join(root, '.stash'))) pass('.stash connected');
else fail('.stash', 'run: stash connect');

// Stash CLI
if (!existsSync(STASH_EXE) && bin === 'stash') {
  warn('stash CLI', 'not in default path — prime may use local files only');
} else {
  const who = stashRun(['whoami']);
  if (who.ok && !who.out.includes('401')) pass('Stash auth', who.out.split('\n')[0]);
  else fail('Stash auth', 'run: stash signin');

  for (const q of ['SOLARIS survey', 'dev:local', 'hetzner']) {
    const s = stashRun(['search', q, '--json']);
    if (!s.ok) {
      fail(`search "${q}"`);
      continue;
    }
    let count = 0;
    try {
      count = JSON.parse(s.out || '[]').length;
    } catch {
      count = 0;
    }
    if (count > 0) pass(`search "${q}"`, `${count} hits`);
    else warn(`search "${q}"`, 'no hits');
  }
}

// Loop 0 prime
const prime = await runNode('stash-prime.mjs', ['verify']);
if (prime.ok) pass('stash:prime');
else fail('stash:prime', prime.out.slice(-200));

// Loop 3 survey smoke (direct node — npm spawn flaky on Windows in verify)
const smoke = await runNode('survey-smoke.mjs');
if (smoke.ok) pass('survey:smoke');
else fail('survey:smoke', smoke.out.trim().slice(-120));

const openapiLocal = await fetchStatus('http://127.0.0.1:5173/api/openapi/survey');
if (openapiLocal.ok) pass('openapi/survey route', `5173 → ${openapiLocal.status}`);
else warn('openapi/survey route', 'not running — start: npm run dev:local');

// Local dev stack (optional)
const local = await fetchStatus('http://127.0.0.1:5173/api/survey/health');
if (local.ok) pass('local dev API', `5173 → ${local.status}`);
else warn('local dev API', 'not running — start: npm run dev:local');

// Production (expected blocked until Hetzner/Coolify)
const prod = await fetchStatus('https://solaris-cet.com/api/survey/health');
if (prod.ok) pass('prod survey API', '200');
else warn('prod survey API', `${prod.status} — BLOCKED until VPS redeploy`);

console.log('\n── Loop checklist ──');
console.log('0 Memory  → npm run stash:prime -- <topic>');
console.log('3 Verify  → npm run dev:local + survey:smoke');
console.log('7 Retro   → npm run stash:sync');
console.log(`\n${failures === 0 ? '✓' : '✗'} Verify complete (${failures} hard failures)\n`);
process.exit(failures > 0 ? 1 : 0);