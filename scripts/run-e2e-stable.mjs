#!/usr/bin/env node
/** Windows-safe test:e2e:stable — single worker. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, ['scripts/run-e2e-batched.mjs'], {
  cwd: path.join(root, 'app'),
  stdio: 'inherit',
  env: { ...process.env, PW_WORKERS: '1' },
  shell: false,
});
process.exit(r.status ?? 1);