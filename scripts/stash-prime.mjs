#!/usr/bin/env node
/**
 * Loop 0 — Memory prime: verify Stash + search project context.
 * Usage: npm run stash:prime
 *        npm run stash:prime -- survey deploy
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const topic = process.argv.slice(2).join(' ') || 'SOLARIS survey deploy';

const STASH_PATHS = [
  join(process.env.LOCALAPPDATA ?? '', 'Packages', 'PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0', 'LocalCache', 'local-packages', 'Python312', 'Scripts', 'stash.exe'),
  'stash',
];

function stashBin() {
  for (const p of STASH_PATHS) {
    if (p === 'stash') return p;
    if (existsSync(p)) return p;
  }
  return null;
}

function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: 'utf8', shell: bin === 'stash', windowsHide: true });
  return { ok: r.status === 0, out: (r.stdout || r.stderr || '').trim() };
}

const bin = stashBin();
console.log('═══ SOLARIS CET — Loop 0 Memory Prime ═══\n');

if (!bin) {
  console.log('⚠ stash CLI not found — using local files only');
  console.log('  → docs/planning/agent-memory.md');
  console.log('  → docs/planning/grok.md');
  process.exit(0);
}

const who = run(bin, ['whoami']);
if (!who.ok || who.out.includes('401')) {
  console.log('⚠ Stash not authenticated — run: stash signin');
  process.exit(1);
}
console.log('✓ Stash auth OK\n');

const queries = [topic, 'hetzner', 'dev:local', 'coolify', 'anti-pattern'];
for (const q of queries) {
  const res = run(bin, ['search', q, '--json']);
  if (!res.ok) {
    console.log(`✗ search "${q}" failed`);
    continue;
  }
  let hits = [];
  try {
    hits = JSON.parse(res.out || '[]');
  } catch {
    hits = [];
  }
  const names = [...new Set(hits.map((h) => h.name || h.ref).filter(Boolean))];
  console.log(`search "${q}": ${names.length ? names.join(', ') : '(no hits)'}`);
}

console.log('\n── Local memory (always read) ──');
for (const f of ['docs/planning/agent-memory.md', 'docs/planning/grok.md', 'docs/planning/global.md']) {
  const p = join(root, f);
  console.log(existsSync(p) ? `✓ ${f}` : `✗ missing ${f}`);
}

const stashFile = join(root, '.stash');
console.log(existsSync(stashFile) ? '✓ .stash connected' : '✗ run: stash connect');

console.log('\n── Loop order (0→7) ──');
console.log('0 Memory → 1 Research → 2 Build → 3 Verify → 4 Optimize → 5 Agent → 6 Feedback → 7 Retrospective');
console.log('\n── Verify commands ──');
console.log('  npm run dev:local');
console.log('  npm run survey:smoke');
console.log('  SITE_URL=https://solaris-cet.com npm run survey:prod-gate  # after VPS up');
console.log('  SOFT_FAIL=1 npm run survey:prod-gate  # until Coolify redeploy');
console.log('  npm run deploy:status');
console.log('\n✓ Prime complete — proceed to Research Loop\n');