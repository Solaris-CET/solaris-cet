import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');
const OUTPUT_PATH = path.join(REPO_ROOT, 'app', 'public', 'release-notes.json');

function parseReleaseHeader(line) {
  const match = /^##\s+\[(.+?)\](?:\s+—\s+(\d{4}-\d{2}-\d{2}))?\s*$/.exec(line);
  if (!match) return null;
  return { version: match[1], date: match[2] ?? null };
}

function parseSectionHeader(line) {
  const match = /^###\s+(.+?)\s*$/.exec(line);
  if (!match) return null;
  return match[1];
}

function isReferenceLink(line) {
  return /^\[[^\]]+\]:\s+https?:\/\//.test(line);
}

function finalize(releases) {
  return {
    generatedAt: new Date().toISOString(),
    source: 'CHANGELOG.md',
    releases,
  };
}

function parseChangelog(markdown) {
  const lines = markdown.split(/\r?\n/);

  const releases = [];
  let currentRelease = null;
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    if (isReferenceLink(line)) continue;

    const rel = parseReleaseHeader(line);
    if (rel) {
      currentRelease = {
        version: rel.version,
        date: rel.date,
        sections: {},
      };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }

    const sec = parseSectionHeader(line);
    if (sec && currentRelease) {
      currentSection = sec;
      if (!currentRelease.sections[currentSection]) {
        currentRelease.sections[currentSection] = [];
      }
      continue;
    }

    if (!currentRelease || !currentSection) continue;

    const bulletMatch = /^-\s+(.+)$/.exec(line);
    if (bulletMatch) {
      currentRelease.sections[currentSection].push(bulletMatch[1].trim());
      continue;
    }

    const continuationMatch = /^\s{2,}(.+)$/.exec(line);
    if (continuationMatch) {
      const items = currentRelease.sections[currentSection];
      if (items.length > 0) {
        items[items.length - 1] = `${items[items.length - 1]} ${continuationMatch[1].trim()}`;
      }
    }
  }

  return releases;
}

async function main() {
  const markdown = await fs.readFile(CHANGELOG_PATH, 'utf8');
  const releases = parseChangelog(markdown);
  const payload = finalize(releases);
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

await main();
