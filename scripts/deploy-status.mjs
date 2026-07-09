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

function responseHint(res) {
  const poweredBy = res.headers.get('powered-by') ?? '';
  if (/shopify/i.test(poweredBy)) {
    return 'domain serves Shopify (DNS drift — not Coolify app)';
  }
  const location = res.headers.get('location') ?? '';
  if (/shop\.solaris-cet\.com/i.test(location)) {
    return 'redirects to shop.solaris-cet.com (Shopify)';
  }
  return null;
}

async function prodHealth() {
  try {
    const res = await fetch(`${SITE}/health.json`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, status: res.status, hint: responseHint(res) };
    return { ok: true, json: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function surveyHealth() {
  try {
    const res = await fetch(`${SITE}/api/survey/health`, {
      signal: AbortSignal.timeout(10_000),
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      return { ok: false, status: res.status, hint: responseHint(res) };
    }
    if (!res.ok) return { ok: false, status: res.status, hint: responseHint(res) };
    return { ok: true, json: await res.json() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function formatFail(result, fallback) {
  const parts = [];
  if (result.status != null) parts.push(String(result.status));
  if (result.error) parts.push(result.error);
  if (result.hint) parts.push(result.hint);
  return parts.length ? parts.join(' — ') : fallback;
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
  console.log(`Prod health: FAIL — ${formatFail(health, 'unknown')}`);
}

if (survey.ok) {
  const engineOk = survey.json?.engine?.ok;
  const keys = survey.json?.engine?.installer_keys_required;
  console.log(`Survey API:  ${engineOk ? 'OK' : 'DEGRADED'} — installer_keys_required=${keys}`);
} else {
  const detail = formatFail(survey, 'unreachable');
  const suffix = survey.hint ? '' : ' (Coolify redeploy or SITE_URL?)';
  console.log(`Survey API:  FAIL — ${detail}${suffix}`);
}

const aligned = health.ok && survey.ok;
process.exit(aligned ? 0 : 1);