#!/usr/bin/env node
/**
 * Deploy survey stack locally or validate prod-like compose + smoke.
 * Usage: node scripts/deploy-survey-stack.mjs [--smoke-only]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smokeOnly = process.argv.includes('--smoke-only');

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

if (!smokeOnly) {
  console.log('SOLARIS CET — deploy survey stack (docker compose)');
  run('docker', ['compose', '-f', 'docker/docker-compose.survey.yml', 'up', '--build', '-d']);
  console.log('\nWaiting for healthchecks...');
  spawnSync('node', ['-e', 'setTimeout(()=>{},15000)'], { cwd: root, stdio: 'inherit', shell: true });
}

run('node', ['scripts/survey-smoke.mjs']);
run('node', ['scripts/survey-bridge-smoke.mjs']);
console.log('\n✓ Survey stack ready (engine + bridge smoke)');