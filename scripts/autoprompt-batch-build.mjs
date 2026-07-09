#!/usr/bin/env node
/**
 * Build AUTOPROMPT_BATCH_100.json from:
 *   - 10 HARD tasks (docs/planning/10_HARD_RANDOM_TASKS.md)
 *   - 20 MEDIUM tasks (open P1 from improvements registry, survey/product bias)
 *   - 70 SMALL tasks (open P3 from improvements registry)
 *
 * Usage: npm run autoprompt:batch:build
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hardMd = join(root, 'docs', 'planning', '10_HARD_RANDOM_TASKS.md');
const registry = join(root, 'docs', 'planning', 'improvements', 'registry.jsonl');
const out = join(root, 'docs', 'planning', 'AUTOPROMPT_BATCH_100.json');

const SURVEY_BIAS = /survey|twin|router|installer|offline|pwa|batch|crm|ahj|pipeline|api\/survey|survey-engine/i;

function parseHardTasks() {
  const text = readFileSync(hardMd, 'utf8');
  const re = /^## (HARD-\d{3}): ([^\n]+)/gm;
  const starts = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    starts.push({ id: m[1], titleLine: m[2].trim(), index: m.index });
  }
  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : text.length;
    const block = text.slice(start.index, end);
    const title = start.titleLine.replace(/\s*—\s*DONE.*$/i, '').trim();
    const done = /—\s*DONE/i.test(start.titleLine) || /\*\*DONE:\*\*/.test(block);
    const verifyMatch = block.match(/\*\*VERIFY:\*\*\s*\n+```bash\n([\s\S]*?)```/);
    const verify = verifyMatch
      ? verifyMatch[1].trim().split('\n').filter((l) => l && !l.startsWith('#'))
      : ['npm run verify:fast'];
    const domainMatch = block.match(/\*\*Domain:\*\*\s*(.+)/);
    return {
      id: start.id,
      tier: 'hard',
      title,
      status: done ? 'done' : 'open',
      domain: domainMatch ? domainMatch[1].trim() : 'cross-cutting',
      source: '10_HARD_RANDOM_TASKS.md',
      verify_commands: verify,
      goal: `${start.id}: ${title}`,
    };
  });
}

function loadRegistry() {
  if (!existsSync(registry)) return [];
  return readFileSync(registry, 'utf8')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function pickImprovements(items, priority, count, preferSurvey = true) {
  const open = items.filter((it) => it.status === 'open' && it.priority === priority);
  const scored = open.map((it) => ({
    it,
    score: (preferSurvey && SURVEY_BIAS.test(`${it.path} ${it.category} ${it.dimension}`) ? 10 : 0)
      + (it.category === 'survey-engine' ? 8 : 0)
      + (it.category === 'api' ? 6 : 0),
  }));
  scored.sort((a, b) => b.score - a.score || a.it.id.localeCompare(b.it.id));
  return scored.slice(0, count).map(({ it }) => ({
    id: it.id,
    tier: priority === 'P1' ? 'medium' : 'small',
    title: `${it.dimension} on ${it.path}`,
    status: 'open',
    domain: it.category,
    source: 'improvements/registry.jsonl',
    path: it.path,
    dimension: it.dimension,
    priority: it.priority,
    verify_commands: ['npm run improve:verify', 'npm run verify:fast'],
    goal: `IMP ${it.id}: ${it.dimension} improvement at ${it.path} (${it.priority})`,
  }));
}

const hard = parseHardTasks();
const items = loadRegistry();
const medium = pickImprovements(items, 'P1', 20, true);
const small = pickImprovements(items, 'P3', 70, true);

// If not enough P3 survey-biased, fill from any open P3
if (small.length < 70) {
  const have = new Set(small.map((t) => t.id));
  const rest = items
    .filter((it) => it.status === 'open' && it.priority === 'P3' && !have.has(it.id))
    .slice(0, 70 - small.length)
    .map((it) => ({
      id: it.id,
      tier: 'small',
      title: `${it.dimension} on ${it.path}`,
      status: 'open',
      domain: it.category,
      source: 'improvements/registry.jsonl',
      path: it.path,
      dimension: it.dimension,
      priority: it.priority,
      verify_commands: ['npm run improve:verify'],
      goal: `IMP ${it.id}: ${it.dimension} at ${it.path}`,
    }));
  small.push(...rest);
}

const batch = {
  version: '1.0',
  built_at: new Date().toISOString(),
  totals: { hard: hard.length, medium: medium.length, small: small.length, all: hard.length + medium.length + small.length },
  tiers: ['hard', 'medium', 'small'],
  tier_order: ['hard', 'medium', 'small'],
  tasks: [...hard, ...medium, ...small],
};

writeFileSync(out, JSON.stringify(batch, null, 2));

const open = batch.tasks.filter((t) => t.status === 'open');
const done = batch.tasks.filter((t) => t.status === 'done');
console.log('═══ AUTOPROMPT Batch 100 Built ═══\n');
console.log(`Output: ${out}`);
console.log(`Total:  ${batch.tasks.length} (hard ${hard.length}, medium ${medium.length}, small ${small.length})`);
console.log(`Open:   ${open.length} · Done: ${done.length}`);
console.log('\nNext hard open:', open.find((t) => t.tier === 'hard')?.id ?? 'none');
console.log('Next medium:', open.find((t) => t.tier === 'medium')?.id ?? 'none');
console.log('Next small:', open.find((t) => t.tier === 'small')?.id ?? 'none');