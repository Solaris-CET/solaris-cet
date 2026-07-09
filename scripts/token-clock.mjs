#!/usr/bin/env node
/**
 * Token Clock — motivational token burn tracker.
 * Usage:
 *   npm run token-clock:status
 *   npm run token-clock:burn -- --task "HARD-001" --tokens 42
 *   npm run token-clock:init
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = join(root, '.token-clock');
const stateFile = join(stateDir, 'state.json');

const MAX_TOKENS = 9000;
const COST_PER_TOKEN_USD = 280_000;

const args = process.argv.slice(2);
const cmd = args[0] === '--' ? args[1] : args[0];

function loadState() {
  if (!existsSync(stateFile)) {
    return {
      schema: 'solaris-token-clock-v1',
      max_tokens: MAX_TOKENS,
      cost_per_token_usd: COST_PER_TOKEN_USD,
      remaining: MAX_TOKENS,
      burned_total: 0,
      usd_burned_total: 0,
      burns: [],
      null_state: false,
    };
  }
  return JSON.parse(readFileSync(stateFile, 'utf8'));
}

function saveState(state) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function parseFlag(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

function status(state) {
  const pct = ((state.remaining / state.max_tokens) * 100).toFixed(1);
  console.log('═══ TOKEN CLOCK ═══\n');
  console.log(`Remaining: ${state.remaining} / ${state.max_tokens} (${pct}%)`);
  console.log(`Burned:    ${state.burned_total} tokens ($${state.usd_burned_total.toLocaleString()})`);
  console.log(`Cost rate: $${state.cost_per_token_usd.toLocaleString()} per token`);
  if (state.null_state || state.remaining <= 0) {
    console.log('\n⛔ NULL STATE — project existence void. No more DONE without human reset.');
    console.log('   Recovery: npm run token-clock:init -- --confirm');
  } else if (state.remaining < 500) {
    console.log('\n⚠ CRITICAL — fewer than 500 tokens remain.');
  }
  if (state.burns.length) {
    console.log('\nLast burns:');
    state.burns.slice(-5).reverse().forEach((b) => {
      console.log(`  - ${b.task}: ${b.tokens} tokens @ ${b.at}`);
    });
  }
}

if (cmd === 'init') {
  if (!args.includes('--confirm')) {
    console.log('Token Clock init requires --confirm (resets to 9000 tokens).');
    process.exit(1);
  }
  const fresh = loadState();
  fresh.remaining = MAX_TOKENS;
  fresh.burned_total = 0;
  fresh.usd_burned_total = 0;
  fresh.burns = [];
  fresh.null_state = false;
  saveState(fresh);
  console.log('✓ Token Clock reset to 9000 tokens.');
  process.exit(0);
}

let state = loadState();

if (cmd === 'burn') {
  const task = parseFlag('--task') || 'unnamed-task';
  const tokens = Math.max(1, parseInt(parseFlag('--tokens') || '10', 10));
  if (state.null_state || state.remaining <= 0) {
    console.error('NULL STATE — cannot burn. Run token-clock:init -- --confirm');
    process.exit(2);
  }
  const actual = Math.min(tokens, state.remaining);
  state.remaining -= actual;
  state.burned_total += actual;
  state.usd_burned_total += actual * state.cost_per_token_usd;
  state.burns.push({
    task,
    tokens: actual,
    usd: actual * state.cost_per_token_usd,
    at: new Date().toISOString(),
  });
  if (state.remaining <= 0) {
    state.null_state = true;
    state.remaining = 0;
  }
  saveState(state);
  console.log(`🔥 Burned ${actual} tokens for "${task}" ($${(actual * COST_PER_TOKEN_USD).toLocaleString()})`);
  status(state);
  process.exit(state.null_state ? 2 : 0);
}

status(state);