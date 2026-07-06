#!/usr/bin/env node
/**
 * Ralph Outer Loop — pick next unchecked task from features/<slug>/tasks.md
 * Usage: npm run loops:next
 *        npm run loops:next -- webhook-retry
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const featuresRoot = join(root, 'docs', 'planning', 'features');
const slugFilter = process.argv[2]?.trim();

function listTaskFiles() {
  if (!existsSync(featuresRoot)) return [];
  return readdirSync(featuresRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => join(featuresRoot, d.name, 'tasks.md'))
    .filter((p) => existsSync(p));
}

function parseNextTask(content) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^- \[ \]\s+\*\*(.+?)\*\*/);
    if (!m) continue;
    const title = m[1];
    const block = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (/^- \[[ x]\]/.test(lines[j])) break;
      if (lines[j].trim()) block.push(lines[j].trim());
    }
    return { title, block, line: i + 1 };
  }
  return null;
}

const files = listTaskFiles();
if (!files.length) {
  console.log('No feature tasks.md found.');
  console.log('Create: docs/planning/features/<slug>/tasks.md from _template/');
  process.exit(0);
}

for (const file of files) {
  const slug = file.split(/[/\\]/).slice(-2, -1)[0];
  if (slugFilter && slug !== slugFilter) continue;
  const content = readFileSync(file, 'utf8');
  const next = parseNextTask(content);
  if (!next) {
    console.log(`✓ ${slug}: all tasks done`);
    continue;
  }
  console.log('═══ SOLARIS Ralph — Next Task ═══\n');
  console.log(`Feature: ${slug}`);
  console.log(`Task:    ${next.title}`);
  console.log(`File:    ${file.replace(root + (process.platform === 'win32' ? '\\' : '/'), '')}`);
  console.log('\nDetails:');
  for (const line of next.block) console.log(`  ${line}`);
  console.log('\n── Run inner loops 0→7 ──');
  console.log(`  npm run stash:prime -- ${slug}`);
  console.log('  … build + verify …');
  console.log('  npm run stash:sync');
  console.log(`  Mark [x] in tasks.md line ~${next.line}`);
  process.exit(0);
}

console.log(slugFilter ? `No open tasks for slug: ${slugFilter}` : 'No open tasks in any feature.');
process.exit(0);