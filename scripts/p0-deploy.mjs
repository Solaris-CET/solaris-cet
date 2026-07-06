#!/usr/bin/env node
/**
 * P0 deploy chain from HANDOFF.md §7.1
 * Usage: npm run deploy:p0
 *        npm run deploy:p0 -- --skip-gitea
 *
 * Requires for full pass: COOLIFY_* env + Gitea reachable (or Coolify watches github)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { triggerCoolifyDeploy } from './coolify-deploy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '');
const skipGitea = process.argv.includes('--skip-gitea');
const POLL_MS = Number(process.env.DEPLOY_POLL_MS || 20_000);
const MAX_POLLS = Number(process.env.DEPLOY_MAX_POLLS || 18);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runNode(script, extraEnv = {}) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  return r.status ?? 1;
}

function resolveGit() {
  if (process.env.GIT_EXE) return process.env.GIT_EXE;
  if (process.platform === 'win32') {
    const c = 'C:\\Program Files\\Git\\bin\\git.exe';
    if (existsSync(c)) return c;
  }
  return 'git';
}

async function surveyHealthOk() {
  try {
    const res = await fetch(`${SITE}/api/survey/health`, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return false;
    const body = await res.json();
    return Boolean(body.engine?.ok);
  } catch {
    return false;
  }
}

async function prodHealthOk() {
  try {
    const res = await fetch(`${SITE}/health.json`, { signal: AbortSignal.timeout(12_000) });
    return res.ok;
  } catch {
    return false;
  }
}

console.log('═══ SOLARIS P0 Deploy Chain ═══\n');

// Step 0 — baseline
let code = runNode('deploy-status.mjs');
if (code !== 0) console.log('⚠ deploy:status — prod not aligned (expected pre-deploy)\n');

// Step 1 — Gitea sync
if (!skipGitea) {
  console.log('── Step 1: gitea:push-retry ──');
  code = runNode('gitea-push-retry.mjs');
  if (code !== 0) {
    console.error('✗ Gitea push failed — prod may track origin not github');
    console.log('  Workaround: npm run gitea:push-retry -- --github  (GitHub already at HEAD)');
    console.log('  Or: Coolify redeploy after manual Gitea sync\n');
  }
} else {
  console.log('── Step 1: gitea skipped ──\n');
}

// Step 2 — Coolify trigger
console.log('── Step 2: Coolify redeploy ──');
const coolify = await triggerCoolifyDeploy();
if (!coolify.ok) {
  console.error(`✗ ${coolify.error}`);
  console.log('\nSet in shell or .env (never commit):');
  console.log('  COOLIFY_BASE_URL=https://<your-coolify-host>');
  console.log('  COOLIFY_API_TOKEN=<token>');
  console.log('  COOLIFY_RESOURCE_UUID=<app-uuid>');
  console.log('  COOLIFY_TAG=main');
  console.log('\nOr trigger manually: Coolify UI → Redeploy → branch main\n');
  process.exit(2);
}
console.log(`✓ Deploy triggered tag=${coolify.tag}\n`);

// Step 3 — Poll health
console.log(`── Step 3: poll ${SITE}/api/survey/health ──`);
let ready = false;
for (let i = 1; i <= MAX_POLLS; i += 1) {
  const survey = await surveyHealthOk();
  const health = await prodHealthOk();
  if (survey && health) {
    console.log(`✓ Prod ready after poll ${i}`);
    ready = true;
    break;
  }
  console.log(`… poll ${i}/${MAX_POLLS} survey=${survey} health.json=${health}`);
  await sleep(POLL_MS);
}

if (!ready) {
  console.error('\n✗ Prod never became healthy — check Coolify logs / Hetzner L002DD869');
  process.exit(1);
}

// Step 4 — Gates
console.log('\n── Step 4: deploy:status ──');
code = runNode('deploy-status.mjs');
if (code !== 0) console.log('⚠ SHA mismatch — check health.json version field');

console.log('\n── Step 5: survey:prod-gate (hard) ──');
code = runNode('survey-prod-gate.mjs', { SITE_URL: SITE, SOFT_FAIL: '0' });
if (code !== 0) process.exit(code);

console.log('\n── Step 6: survey:post-deploy ──');
code = runNode('post-deploy-survey.mjs', { SITE_URL: SITE, SOFT_FAIL: '0' });
process.exit(code);