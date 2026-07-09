#!/usr/bin/env node
/**
 * Prime session with the right skills for a topic.
 * Usage: npm run skills:prime -- "twin replay budget"
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topic = process.argv.slice(2).join(' ') || 'SOLARIS CET task';
const manifestPath = join(root, '.agents', 'skills-manifest.json');

const KEYWORDS = [
  { keys: ['loop', 'ralph', 'autoprompt', 'epic', 'task'], skills: ['loops', 'superpowers', 'find-skills', 'token-clock', 'observer'], docs: ['find-loops-skills.md', 'superpowers-loops.md', 'loop-memory.md', 'token-clock-loop.md', 'grok-loop-observer.md', 'anti-halucinatii-loop.md'] },
  { keys: ['design', 'ui', 'ux', 'tailwind', 'awwwards'], skills: ['unique-design'], docs: ['unique-design.md'] },
  { keys: ['memory', 'stash', 'memoria', 'remember'], skills: ['memoria'], docs: ['memoria.md', 'loop-memory.md'] },
  { keys: ['verify', 'test', 'gate'], skills: ['verify', 'review', 'engineering'], docs: ['superpowers.md', 'anti-halucinatii.md'] },
  { keys: ['hallucin', 'honest', 'evidence'], skills: ['anti-hallucinatii', 'observer'], docs: ['anti-halucinatii.md', 'anti-halucinatii-loop.md'] },
];

console.log('═══ SOLARIS CET — Skills Prime ═══\n');
console.log(`Topic: ${topic}\n`);

const lower = topic.toLowerCase();
const picked = new Set(['engineering', 'graphify', 'find-skills', 'superpowers', 'observer', 'token-clock', 'anti-hallucinatii']);
const docs = new Set(['find-skills.md', 'superpowers.md', 'memoria.md', 'token-clock.md', 'grok-observer.md']);

for (const row of KEYWORDS) {
  if (row.keys.some((k) => lower.includes(k))) {
    row.skills.forEach((s) => picked.add(s));
    row.docs.forEach((d) => docs.add(d));
  }
}

console.log('── Load these skills (read SKILL.md) ──');
for (const s of [...picked].sort()) {
  const path = join(root, '.agents', 'skills', s, 'SKILL.md');
  console.log(existsSync(path) ? `  ✓ .agents/skills/${s}/SKILL.md` : `  ⚠ missing ${s}`);
}

console.log('\n── Read these docs ──');
for (const d of [...docs].sort()) {
  const path = join(root, 'docs', 'planning', d);
  console.log(existsSync(path) ? `  ✓ docs/planning/${d}` : `  ⚠ missing ${d}`);
}

if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  console.log(`\nManifest v${m.version} · ${m.skills?.length ?? 0} skills registered`);
}

console.log('\n── Mandatory pre-touch sequence ──');
console.log('  1. npm run skills:prime -- "<topic>"');
console.log('  2. npm run stash:prime -- "<topic>"');
console.log('  3. npm run graphify:prime -- "<topic>"');
console.log('  4. Read superpowers.md § Pre-Flight BEFORE any code edit');
console.log('  5. npm run token-clock:status before DONE; burn after verify');