#!/usr/bin/env node
/** Windows-safe verify:all */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'app');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, cwd = app) {
  const r = spawnSync(npm, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status ?? 1;
}

if (run(['run', 'verify']) !== 0) process.exit(1);
if (run(['run', 'test:e2e:stable']) !== 0) process.exit(1);
if (process.env.RUN_E2E_EXTENDED === '1') {
  if (run(['run', 'test:e2e:extended']) !== 0) process.exit(1);
}
process.exit(0);