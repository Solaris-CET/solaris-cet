#!/usr/bin/env node
/**
 * Aider wrapper — lint/test after edit (Aider-AI pattern from SOLARIS-LOOPS-MASTER).
 * Usage: npm run aider -- "fix run-e2e-batched Windows path"
 *        node scripts/aider-run.mjs --message "task description"
 *
 * Requires: pip install aider-chat
 * Env: DEEPSEEK_API_KEY (aider --model deepseek)
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const messageIdx = args.indexOf('--message');
const message =
  messageIdx >= 0
    ? args.slice(messageIdx + 1).join(' ')
    : args.join(' ') || 'Surgical fix per SOLARIS perfect loops — run verify:fast after.';

function resolveAider() {
  const candidates = [
    process.env.AIDER_EXE,
    'aider',
    joinLocalAppData('aider.exe'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === 'aider') {
      const r = spawnSync('where', ['aider'], { encoding: 'utf8', shell: true });
      if (r.status === 0) return 'aider';
      continue;
    }
    if (existsSync(c)) return c;
  }
  return null;
}

function joinLocalAppData(name) {
  const base = process.env.LOCALAPPDATA;
  if (!base) return null;
  return `${base}\\Programs\\Python\\Python312\\Scripts\\${name}`;
}

const aider = resolveAider();
if (!aider) {
  console.log('═══ Aider not installed ═══\n');
  console.log('Install: pip install aider-chat');
  console.log('Set DEEPSEEK_API_KEY then: aider --model deepseek');
  console.log(`\nFallback task for Grok/DeepSeek agent:\n  ${message}`);
  process.exit(0);
}

const model = process.env.AIDER_MODEL || 'deepseek/deepseek-chat';
const aiderArgs = [
  '--model',
  model,
  '--message',
  message,
  '--yes',
  '--no-auto-commits',
  '--map-tokens',
  '2048',
];

console.log(`═══ Aider (${model}) ═══\n${message}\n`);

const r = spawnSync(aider, aiderArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, AIDER_NO_AUTO_COMMIT: '1' },
});

process.exit(r.status ?? 1);