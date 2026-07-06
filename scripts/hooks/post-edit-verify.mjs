#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook — scoped verify after survey/app edits.
 * Reads hook input JSON from stdin (tool_name, tool_input).
 */
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function readStdin() {
  return new Promise((resolvePromise) => {
    let data = '';
    const rl = createInterface({ input: process.stdin });
    rl.on('line', (line) => { data += line; });
    rl.on('close', () => resolvePromise(data));
    setTimeout(() => resolvePromise(data), 500);
  });
}

function run(args, cwd = root) {
  const r = spawnSync(npm, args, { cwd, encoding: 'utf8', windowsHide: true, shell: false });
  return r.status === 0;
}

const raw = await readStdin();
let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  process.exit(0);
}

const path =
  payload.tool_input?.file_path ??
  payload.tool_input?.path ??
  payload.file_path ??
  '';

if (!path) process.exit(0);

const norm = path.replace(/\\/g, '/');

if (norm.includes('survey-engine/')) {
  const ok = run(['run', 'survey:test'], root);
  process.exit(ok ? 0 : 2);
}

if (norm.includes('app/') && (norm.includes('survey') || norm.includes('api/'))) {
  const ok = run(['run', 'survey:smoke'], root);
  process.exit(ok ? 0 : 2);
}

process.exit(0);