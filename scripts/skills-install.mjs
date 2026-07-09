#!/usr/bin/env node
/**
 * SOLARIS CET — Install Grok 4.5 agent skills across platforms.
 * Usage: npm run skills:install
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '.agents', 'skills');
const targets = [
  join(root, '.claude', 'skills'),
  join(root, '.cursor', 'skills'),
];

const CORE_SKILLS = [
  'engineering',
  'loops',
  'graphify',
  'verify',
  'review',
  'superpowers',
  'find-skills',
  'memoria',
  'observer',
  'token-clock',
  'unique-design',
  'anti-hallucinatii',
];

function listSkillDirs(base) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(base, d.name, 'SKILL.md')))
    .map((d) => d.name);
}

function copySkill(name) {
  const src = join(source, name);
  if (!existsSync(join(src, 'SKILL.md'))) {
    console.warn(`  ⚠ skip ${name} — no SKILL.md in .agents/skills/`);
    return false;
  }
  for (const targetRoot of targets) {
    mkdirSync(targetRoot, { recursive: true });
    const dest = join(targetRoot, name);
    cpSync(src, dest, { recursive: true, force: true });
  }
  return true;
}

console.log('═══ SOLARIS CET — Skills Install (Grok 4.5) ═══\n');

const available = listSkillDirs(source);
let installed = 0;
for (const name of CORE_SKILLS) {
  if (copySkill(name)) {
    console.log(`  ✓ ${name}`);
    installed++;
  }
}

// Also sync any extra skills already in .agents/skills
for (const name of available) {
  if (!CORE_SKILLS.includes(name) && copySkill(name)) {
    console.log(`  ✓ ${name} (extra)`);
    installed++;
  }
}

const manifest = {
  version: '1.0',
  updated: new Date().toISOString(),
  skills: CORE_SKILLS.filter((n) => existsSync(join(source, n, 'SKILL.md'))),
  docs: [
    'docs/planning/find-skills.md',
    'docs/planning/find-loops-skills.md',
    'docs/planning/superpowers.md',
    'docs/planning/superpowers-loops.md',
    'docs/planning/memoria.md',
    'docs/planning/loop-memory.md',
    'docs/planning/unique-design.md',
    'docs/planning/grok-observer.md',
    'docs/planning/grok-loop-observer.md',
    'docs/planning/token-clock.md',
    'docs/planning/token-clock-loop.md',
    'docs/planning/anti-halucinatii.md',
    'docs/planning/anti-halucinatii-loop.md',
  ],
  prime_command: 'npm run skills:prime -- "<topic>"',
};
writeFileSync(join(root, '.agents', 'skills-manifest.json'), JSON.stringify(manifest, null, 2));

// Graphify skill hook (AST-only, no API key)
const graphify = spawnSync(
  process.platform === 'win32' ? 'python' : 'python3',
  ['-m', 'graphify', 'install', '--project', '--platform', 'cursor'],
  { cwd: root, encoding: 'utf8', shell: false },
);
if (graphify.status === 0) {
  console.log('\n  ✓ graphify cursor platform');
} else {
  console.log('\n  (graphify install skipped — pip install graphifyy if needed)');
}

console.log(`\n✓ Installed ${installed} skills → .claude/skills + .cursor/skills`);
console.log('  Manifest: .agents/skills-manifest.json');
console.log('\nNext: npm run skills:prime -- "your task"');