#!/usr/bin/env node
/**
 * Compare local git SHA vs production health.json version.
 * Usage: node scripts/deploy-status.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '');

function resolveGit() {
  if (process.env.GIT_EXE) return process.env.GIT_EXE;
  if (process.platform === 'win32') {
    const candidate = 'C:\\Program Files\\Git\\bin\\git.exe';
    if (existsSync(candidate)) return candidate;
  }
  return 'git';
}

function localSha() {
  const git = resolveGit();
  const r = spawnSync(git, ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  });
  return r.status === 0 ? r.stdout.trim() : 'unknown';
}

async function prodHealth() {
  try {
    const res = await fetch(`${SITE}/health.json`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, json: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function surveyHealth() {
  try {
    const res = await fetch(`${SITE}/api/survey/health`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, json: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const sha = localSha();
const health = await prodHealth();
const survey = await surveyHealth();

console.log('═══ SOLARIS Deploy Status ═══');
console.log(`Local SHA:  ${sha}`);
console.log(`Site:       ${SITE}`);

if (health.ok) {
  const v = health.json?.version ?? health.json?.gitSha ?? '—';
  console.log(`Prod health: OK — version=${v}`);
} else {
  console.log(`Prod health: FAIL — ${health.status ?? health.error}`);
}

if (survey.ok) {
  const engineOk = survey.json?.engine?.ok;
  const keys = survey.json?.engine?.installer_keys_required;
  console.log(`Survey API:  ${engineOk ? 'OK' : 'DEGRADED'} — installer_keys_required=${keys}`);
} else {
  console.log(`Survey API:  FAIL — ${survey.status ?? survey.error} (Coolify redeploy needed?)`);
}

const aligned = health.ok && survey.ok;
process.exit(aligned ? 0 : 1);