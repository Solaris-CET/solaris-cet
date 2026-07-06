#!/usr/bin/env node
/**
 * Trigger Coolify redeploy + poll survey health + prod gate.
 * Requires: COOLIFY_BASE_URL, COOLIFY_API_TOKEN, COOLIFY_RESOURCE_UUID, COOLIFY_TAG
 * Usage: node scripts/coolify-redeploy-survey.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { triggerCoolifyDeploy } from './coolify-deploy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '');
const POLL_MS = Number(process.env.DEPLOY_POLL_MS || 20_000);
const MAX_POLLS = Number(process.env.DEPLOY_MAX_POLLS || 18);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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

const deploy = await triggerCoolifyDeploy();
if (!deploy.ok) {
  console.error(`Coolify deploy trigger failed: ${deploy.error}`);
  process.exit(deploy.status === 2 ? 2 : 1);
}
console.log(`✓ Coolify deploy triggered tag=${deploy.tag}`);

console.log(`Polling ${SITE}/api/survey/health every ${POLL_MS}ms…`);
for (let i = 1; i <= MAX_POLLS; i += 1) {
  if (await surveyHealthOk()) {
    console.log(`✓ Survey health OK after poll ${i}`);
    const gate = spawnSync(process.execPath, ['scripts/survey-prod-gate.mjs'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, SITE_URL: SITE, SOFT_FAIL: process.env.SOFT_FAIL || '1' },
    });
    process.exit(gate.status ?? 0);
  }
  console.log(`… poll ${i}/${MAX_POLLS} not ready`);
  await sleep(POLL_MS);
}

console.error('✗ Survey health never became OK after redeploy');
process.exit(1);