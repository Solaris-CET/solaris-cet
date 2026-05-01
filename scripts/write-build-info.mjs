#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const target = join(root, 'app', 'api', 'lib', 'buildInfo.ts');

function readGitSha() {
  const envSha = String(process.env.GIT_SHA ?? '').trim();
  if (envSha) return envSha;
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

const sha = readGitSha().slice(0, 12);
const iso = String(process.env.BUILD_TIMESTAMP ?? '').trim() || new Date().toISOString();
const date = iso.slice(0, 10);

writeFileSync(
  target,
  [
    `export const BUILD_GIT_SHA = ${JSON.stringify(sha)};`,
    `export const BUILD_DATE = ${JSON.stringify(date)};`,
    '',
  ].join('\n'),
);

