#!/usr/bin/env node
/** Windows-safe preview:e2e — raised heap for Playwright. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=8192'].filter(Boolean).join(' '),
};
const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'run-bin.mjs'), 'vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  cwd: path.join(root, 'app'),
  stdio: 'inherit',
  env,
});
process.exit(r.status ?? 1);