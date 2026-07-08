#!/usr/bin/env node
/**
 * AEP Orchestrator — drive Kimi Code headless through the Agent Engineering Protocol
 * (docs/planning/AGENT-ENGINEERING.md). The orchestrator, not the model, enforces the
 * deterministic parts: gate verification in code, max 3 attempts, fresh context per
 * attempt with a recovery brief, checkpoint logging.
 *
 * Usage: npm run kimi:aep -- --task "fix run-e2e-batched Windows path"
 *        npm run kimi:aep -- --next            # pull next task from loops:next
 *        npm run kimi:aep -- --task "..." --gate "npm run verify:fast"
 *        npm run kimi:aep -- --task "..." --no-gate --yolo
 *        npm run kimi:aep -- --task "..." --safe      # no auto-approve (read-only runs)
 *        npm run kimi:aep -- --task "..." --dry-run   # print prompt, no API call
 *
 * Defaults: gate = `npm run verify:fast`, permission mode = --auto, 3 attempts,
 * 20 min per attempt. Logs to docs/planning/aep-runs/.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

// Resolve Kimi's JS entry point and invoke it via node directly — spawning the
// `kimi` .cmd shim through a shell mangles multiline prompts on Windows.
function resolveKimiEntry() {
  const candidates = [
    process.env.KIMI_ENTRY,
    join(process.env.APPDATA ?? '', 'npm', 'node_modules', '@moonshot-ai', 'kimi-code', 'dist', 'main.mjs'),
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  const r = spawnSync('npm', ['root', '-g'], { shell: true, encoding: 'utf8' });
  const fromNpm = join((r.stdout || '').trim(), '@moonshot-ai', 'kimi-code', 'dist', 'main.mjs');
  if (existsSync(fromNpm)) return fromNpm;
  console.error('Cannot locate kimi-code entry (dist/main.mjs). Set KIMI_ENTRY or npm i -g @moonshot-ai/kimi-code.');
  process.exit(1);
}

function flag(name) {
  return args.includes(`--${name}`);
}
function opt(name, fallback = null) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
}

const MAX_ATTEMPTS = Number(opt('attempts', '3'));
const ATTEMPT_TIMEOUT_MS = Number(opt('timeout-min', '20')) * 60 * 1000;
const gateCmd = flag('no-gate') ? null : opt('gate', 'npm run verify:fast');
// --safe: no auto-approve (Kimi's default permission prompts apply; good for read-only runs
// and for orchestrating from another agent). --yolo: approve everything. Default: --auto.
const permMode = flag('safe') ? null : flag('yolo') ? '--yolo' : '--auto';
const dryRun = flag('dry-run');

function sh(cmd, opts = {}) {
  return spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', ...opts });
}

function resolveTask() {
  const explicit = opt('task');
  if (explicit) return explicit;
  if (flag('next')) {
    const r = sh('npm run --silent loops:next');
    const out = (r.stdout || '').trim();
    if (!out || /all tasks done|No feature tasks/.test(out)) {
      console.error('loops:next returned no open task. Pass --task "..." instead.');
      process.exit(1);
    }
    return `Execute the next Ralph task exactly as specified below.\n\n${out}`;
  }
  console.error('Usage: npm run kimi:aep -- --task "<description>"  (or --next)');
  process.exit(1);
}

function buildPrompt(task, attempt, recoveryBrief) {
  const recovery = recoveryBrief
    ? `\n## Recovery brief (attempt ${attempt} of ${MAX_ATTEMPTS} — previous attempt FAILED)\n` +
      `${recoveryBrief}\n` +
      `Per HANDOFF.md: diagnose the root cause first; do NOT repeat the previous strategy verbatim.\n`
    : '';
  return (
    `Run this task under the Agent Engineering Protocol (AEP) — load the \`engineering\` skill ` +
    `and follow phases P0-P6 in order. You are autonomous: never ask the user anything; verify everything yourself.\n` +
    recovery +
    `\n## Task\n${task}\n` +
    `\n## Hard requirements\n` +
    `- P3: run the relevant verify gate yourself before claiming done.\n` +
    `- P4: adversarially self-review your diff (the \`review\` skill's 6 lenses) and fix P0/P1 findings.\n` +
    `- End your FINAL message with exactly this block (the orchestrator parses it):\n` +
    `CHECKPOINT\nDONE: <what shipped>\nVERIFIED: <commands + results>\nLEFT: <remaining>\nBLOCKED: <blockers or "-">\n`
  );
}

function parseCheckpoint(output) {
  // Kimi's TUI-style headless output prefixes lines with "• " and indentation — normalize first.
  const clean = output.split(/\r?\n/).map((l) => l.replace(/^[\s•]+/, '')).join('\n');
  const m = clean.match(/CHECKPOINT\s*\n(DONE:[\s\S]*?BLOCKED:[^\n]*)/);
  if (!m) return null;
  const blocked = m[1].match(/BLOCKED:\s*(.*)/)?.[1]?.trim() ?? '';
  return { text: m[1].trim(), blocked: blocked && blocked !== '-' ? blocked : null };
}

function runGate() {
  if (!gateCmd) return { ok: true, summary: 'gate skipped (--no-gate)' };
  console.log(`\n[aep] running deterministic gate: ${gateCmd}`);
  const r = sh(gateCmd, { timeout: ATTEMPT_TIMEOUT_MS, stdio: ['ignore', 'pipe', 'pipe'] });
  const tail = ((r.stdout || '') + (r.stderr || '')).split(/\r?\n/).filter(Boolean).slice(-15).join('\n');
  return { ok: r.status === 0, summary: `exit ${r.status}\n${tail}` };
}

const task = resolveTask();
const kimiEntry = resolveKimiEntry();
const logDir = join(root, 'docs', 'planning', 'aep-runs');
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
const logFile = join(logDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
const log = (s) => appendFileSync(logFile, s + '\n');

log(`# AEP run — ${new Date().toISOString()}\n\n**Task:** ${task}\n**Gate:** ${gateCmd ?? 'none'} · **Mode:** ${permMode} · **Max attempts:** ${MAX_ATTEMPTS}\n`);

let recoveryBrief = null;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const prompt = buildPrompt(task, attempt, recoveryBrief);
  if (dryRun) {
    console.log(`── dry-run: prompt for attempt ${attempt} ──\n${prompt}`);
    process.exit(0);
  }

  console.log(`\n[aep] attempt ${attempt}/${MAX_ATTEMPTS} — launching kimi (${permMode ?? 'safe'}, fresh context)…`);
  log(`\n## Attempt ${attempt}\n`);
  const r = spawnSync(process.execPath, [kimiEntry, ...(permMode ? [permMode] : []), '-p', prompt], {
    cwd: root, encoding: 'utf8', timeout: ATTEMPT_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
  });
  const output = (r.stdout || '') + (r.stderr || '');
  const tail = output.split(/\r?\n/).filter(Boolean).slice(-40).join('\n');
  log('```\n' + tail + '\n```');

  if (r.error?.code === 'ETIMEDOUT') {
    recoveryBrief = `Attempt ${attempt} timed out after ${ATTEMPT_TIMEOUT_MS / 60000} min. Scope the work smaller.`;
    console.error(`[aep] ${recoveryBrief}`);
    log(`\n**Result:** timeout`);
    continue;
  }

  const cp = parseCheckpoint(output);
  if (!cp) {
    recoveryBrief = `Attempt ${attempt} ended without the mandatory CHECKPOINT block. Last output:\n${tail.split('\n').slice(-8).join('\n')}`;
    console.error('[aep] no checkpoint found in output — retrying with recovery brief');
    log(`\n**Result:** no checkpoint`);
    continue;
  }
  console.log(`\n[aep] checkpoint:\n${cp.text}`);
  log(`\n**Checkpoint:**\n\n${cp.text}`);

  if (cp.blocked) {
    recoveryBrief = `Attempt ${attempt} reported BLOCKED: ${cp.blocked}`;
    console.error(`[aep] agent blocked: ${cp.blocked}`);
    log(`\n**Result:** blocked`);
    continue;
  }

  const gate = runGate();
  log(`\n**Gate:** ${gate.ok ? 'PASS' : 'FAIL'}\n\n\`\`\`\n${gate.summary}\n\`\`\``);
  if (gate.ok) {
    console.log(`\n[aep] ✅ gate PASS — task complete. Log: ${logFile.replace(root, '.')}`);
    process.exit(0);
  }
  recoveryBrief =
    `Attempt ${attempt}: the agent claimed done but the deterministic gate FAILED.\n` +
    `Gate \`${gateCmd}\` output (tail):\n${gate.summary}\nIts checkpoint was:\n${cp.text}`;
  console.error('[aep] ❌ gate FAILED despite done-claim — retrying with gate evidence');
}

log(`\n## FINAL: BLOCKED after ${MAX_ATTEMPTS} attempts\n\n${recoveryBrief}`);
console.error(`\n[aep] ⛔ BLOCKED after ${MAX_ATTEMPTS} attempts (per HANDOFF.md, stopping). Log: ${logFile.replace(root, '.')}`);
process.exit(1);
