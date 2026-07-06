#!/usr/bin/env node
/**
 * Push main to Gitea with retries (504 gateway timeouts).
 * Usage: GITEA_TOKEN=xxx node scripts/gitea-push-retry.mjs
 *        node scripts/gitea-push-retry.mjs --github   # fallback remote github
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const useGithub = process.argv.includes('--github');
const remote = useGithub ? 'github' : 'origin';
const maxAttempts = Number(process.env.GITEA_PUSH_RETRIES || 4);
const delayMs = Number(process.env.GITEA_PUSH_DELAY_MS || 12_000);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveGit() {
  if (process.env.GIT_EXE) return process.env.GIT_EXE;
  if (process.platform === 'win32') {
    const candidate = 'C:\\Program Files\\Git\\bin\\git.exe';
    if (existsSync(candidate)) return candidate;
  }
  return 'git';
}

function gitPush() {
  const git = resolveGit();
  return spawnSync(git, ['push', remote, 'main'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });
}

console.log(`Push ${remote} main (max ${maxAttempts} attempts)`);

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const res = gitPush();
  const out = `${res.stdout || ''}${res.stderr || ''}`.trim();
  if (res.status === 0) {
    console.log(`✓ Push succeeded on attempt ${attempt}`);
    if (out) console.log(out.slice(-400));
    process.exit(0);
  }
  const retryable = /504|502|503|timeout|timed out|ECONNRESET/i.test(out);
  console.error(`✗ attempt ${attempt}/${maxAttempts} failed${retryable ? ' (retryable)' : ''}`);
  if (out) console.error(out.slice(-500));
  if (!retryable || attempt === maxAttempts) process.exit(res.status ?? 1);
  console.log(`Waiting ${delayMs}ms…`);
  await sleep(delayMs);
}