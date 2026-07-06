#!/usr/bin/env node
/**
 * Ralph Outer Loop status — all feature epics at a glance.
 * Usage: npm run loops:status
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const featuresRoot = join(root, 'docs', 'planning', 'features');

function listEpics() {
  if (!existsSync(featuresRoot)) return [];
  return readdirSync(featuresRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => {
      const tasksPath = join(featuresRoot, d.name, 'tasks.md');
      if (!existsSync(tasksPath)) return { slug: d.name, total: 0, done: 0, open: 0, missing: true };
      const content = readFileSync(tasksPath, 'utf8');
      const tasks = [...content.matchAll(/^- \[([ x])\]\s+\*\*(.+?)\*\*/gm)];
      const done = tasks.filter((m) => m[1] === 'x').length;
      return { slug: d.name, total: tasks.length, done, open: tasks.length - done, missing: false };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const epics = listEpics();
const totalOpen = epics.reduce((s, e) => s + e.open, 0);

console.log('═══ SOLARIS Loops Status ═══\n');
console.log(`Epics: ${epics.length} · Open tasks: ${totalOpen}\n`);

for (const e of epics) {
  if (e.missing) {
    console.log(`  ⚠ ${e.slug}: tasks.md missing`);
    continue;
  }
  const pct = e.total ? Math.round((e.done / e.total) * 100) : 0;
  const bar = e.open === 0 ? '✓' : '○';
  console.log(`  ${bar} ${e.slug.padEnd(24)} ${e.done}/${e.total} (${pct}%)`);
}

if (totalOpen === 0) {
  console.log('\nAll epics complete. Run `npm run loops:next` to confirm.');
} else {
  console.log('\nNext: npm run loops:next');
}

process.exit(totalOpen > 0 ? 0 : 0);