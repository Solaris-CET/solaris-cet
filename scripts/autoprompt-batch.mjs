#!/usr/bin/env node
/**
 * AUTOPROMPT Batch 100 — orchestrate 10 hard + 20 medium + 70 small tasks.
 *
 * Usage:
 *   npm run autoprompt:batch:status
 *   npm run autoprompt:batch:next
 *   npm run autoprompt:batch:next -- --tier hard
 *   npm run autoprompt:batch:prime
 *   npm run autoprompt:batch:run -- --tier hard
 *   npm run autoprompt:batch:mark -- HARD-003
 *   npm run autoprompt:batch:mark -- IMP-05379 --verify "pytest ..."
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const batchFile = join(root, 'docs', 'planning', 'AUTOPROMPT_BATCH_100.json');
const stateFile = join(root, '.autoprompt', 'batch-100-state.json');

const args = process.argv.slice(2);
const cmd = args[0] || 'status';
const tierFilter = (() => {
  const i = args.indexOf('--tier');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();
const markId = cmd === 'mark' ? args[1] : null;
const verifyNote = (() => {
  const i = args.indexOf('--verify');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

function loadBatch() {
  if (!existsSync(batchFile)) {
    console.error('Batch file missing. Run: npm run autoprompt:batch:build');
    process.exit(1);
  }
  return JSON.parse(readFileSync(batchFile, 'utf8'));
}

function saveBatch(batch) {
  writeFileSync(batchFile, JSON.stringify(batch, null, 2));
}

function loadState() {
  if (!existsSync(stateFile)) {
    return { current_id: null, history: [], started_at: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(stateFile, 'utf8'));
}

function saveState(state) {
  const dir = join(root, '.autoprompt');
  if (!existsSync(dir)) {
    spawnSync('mkdir', ['-p', dir], { shell: true });
  }
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function nextTask(batch, tier = null) {
  const order = tier ? [tier] : batch.tier_order;
  for (const t of order) {
    const pick = batch.tasks.find((x) => x.tier === t && x.status === 'open');
    if (pick) return pick;
  }
  return null;
}

function summarize(batch) {
  const byTier = {};
  for (const t of batch.tiers) {
    const all = batch.tasks.filter((x) => x.tier === t);
    byTier[t] = { total: all.length, open: all.filter((x) => x.status === 'open').length, done: all.filter((x) => x.status === 'done').length };
  }
  return byTier;
}

function runSh(command) {
  console.log(`\n> ${command}`);
  const r = spawnSync(command, { shell: true, cwd: root, encoding: 'utf8', stdio: 'inherit' });
  return r.status === 0;
}

const batch = loadBatch();

if (cmd === 'status') {
  const s = summarize(batch);
  console.log('═══ AUTOPROMPT Batch 100 Status ═══\n');
  console.log(`Built: ${batch.built_at}`);
  for (const [tier, v] of Object.entries(s)) {
    console.log(`  ${tier.padEnd(8)} ${v.done}/${v.total} done · ${v.open} open`);
  }
  const n = nextTask(batch, tierFilter);
  if (n) {
    console.log(`\nNext (${n.tier}): ${n.id} — ${n.title}`);
    console.log(`Goal: ${n.goal}`);
  } else {
    console.log('\nAll tasks in selected tier(s) complete.');
  }
  process.exit(0);
}

if (cmd === 'next') {
  const n = nextTask(batch, tierFilter);
  if (!n) {
    console.log('No open tasks.');
    process.exit(0);
  }
  console.log('═══ Next Batch Task ═══\n');
  console.log(`ID:     ${n.id}`);
  console.log(`Tier:   ${n.tier}`);
  console.log(`Title:  ${n.title}`);
  console.log(`Goal:   ${n.goal}`);
  if (n.path) console.log(`Path:   ${n.path}`);
  console.log('\nVerify:');
  for (const v of n.verify_commands || []) console.log(`  ${v}`);
  console.log('\nPrime:');
  console.log(`  npm run skills:prime -- "${n.goal}"`);
  console.log(`  npm run stash:prime -- "${n.goal}"`);
  console.log(`  npm run graphify:prime -- "${n.goal}"`);
  console.log(`\nRun: npm run autoprompt:batch:run -- --tier ${n.tier}`);
  console.log(`Mark: npm run autoprompt:batch:mark -- ${n.id}`);
  process.exit(0);
}

if (cmd === 'prime') {
  const n = nextTask(batch, tierFilter);
  if (!n) process.exit(0);
  runSh(`npm run skills:prime -- "${n.goal}"`);
  runSh(`npm run stash:prime -- "${n.goal}"`);
  runSh(`npm run graphify:prime -- "${n.goal}"`);
  console.log(`\n[PRIME] Ready for ${n.id}: ${n.title}`);
  process.exit(0);
}

if (cmd === 'run') {
  const n = nextTask(batch, tierFilter);
  if (!n) {
    console.log('No open tasks to run.');
    process.exit(0);
  }
  const state = loadState();
  state.current_id = n.id;
  state.history.push({ id: n.id, started: new Date().toISOString(), tier: n.tier });
  saveState(state);

  console.log(`\n🚀 AUTOPROMPT Batch — ${n.id} (${n.tier})\n`);
  runSh(`npm run skills:prime -- "${n.goal}"`);
  runSh(`npm run stash:prime -- "${n.goal}"`);
  runSh(`npm run graphify:prime -- "${n.goal}"`);

  const tasksArg = n.verify_commands?.join('|') || 'npm run verify:fast';
  const mode = n.tier === 'hard' ? 'max' : n.tier === 'medium' ? 'max' : 'fast';
  const ok = runSh(
    `node scripts/autoprompt.mjs --goal "${n.goal.replace(/"/g, '\\"')}" --mode ${mode} --tasks "${tasksArg.replace(/"/g, '\\"')}"`,
  );

  console.log('\n── Agent handoff ──');
  console.log(`Task ${n.id} primed. autoprompt runner scaffolded phases.`);
  console.log('Implement in agent session with Pre-Flight (superpowers.md) then:');
  for (const v of n.verify_commands || []) console.log(`  ${v}`);
  console.log(`\nMark done: npm run autoprompt:batch:mark -- ${n.id} --verify "<output>"`);
  process.exit(ok ? 0 : 1);
}

if (cmd === 'mark') {
  if (!markId) {
    console.error('Usage: npm run autoprompt:batch:mark -- <TASK_ID> [--verify "..."]');
    process.exit(1);
  }
  const task = batch.tasks.find((t) => t.id === markId);
  if (!task) {
    console.error(`Task not found: ${markId}`);
    process.exit(1);
  }
  task.status = 'done';
  task.done_at = new Date().toISOString();
  if (verifyNote) task.verified = verifyNote;
  saveBatch(batch);

  if (task.id.startsWith('IMP-')) {
    spawnSync(`node scripts/improvement-mark.mjs ${task.id}`, { shell: true, cwd: root, stdio: 'inherit' });
  }
  if (task.id.startsWith('HARD-')) {
    console.log(`\nUpdate docs/planning/10_HARD_RANDOM_TASKS.md with DONE for ${task.id}`);
  }

  const state = loadState();
  state.history.push({ id: markId, completed: new Date().toISOString(), verified: verifyNote || null });
  saveState(state);

  console.log(`✓ Marked ${markId} done`);
  const n = nextTask(batch);
  if (n) console.log(`Next: ${n.id} (${n.tier}) — ${n.title}`);
  process.exit(0);
}

if (cmd === 'list') {
  const tier = tierFilter;
  const list = batch.tasks.filter((t) => (!tier || t.tier === tier));
  for (const t of list) {
    console.log(`[${t.status === 'done' ? 'x' : ' '}] ${t.id} (${t.tier}) ${t.title}`);
  }
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
console.error('Commands: status | next | prime | run | mark | list');
process.exit(1);