import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { type EmbeddingProvider,embedText } from './embeddings';
import { sha256Hex } from './nodeCrypto';

export type KbSourceFile = { absPath: string; relPath: string; title: string; text: string };

function stripFrontmatter(md: string): string {
  if (!md.startsWith('---')) return md;
  const end = md.indexOf('\n---', 3);
  if (end === -1) return md;
  const after = md.indexOf('\n', end + 4);
  return after === -1 ? '' : md.slice(after + 1);
}

function firstHeading(md: string): string | null {
  const m = md.match(/^\s{0,3}#\s+(.+)\s*$/m);
  if (!m) return null;
  const t = m[1]?.trim() ?? '';
  return t ? t.slice(0, 120) : null;
}

function normalizeText(md: string): string {
  return stripFrontmatter(md)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function chunkText(text: string, opts?: { maxChars?: number; overlapChars?: number }): string[] {
  const maxChars = Math.max(400, Math.min(2400, opts?.maxChars ?? 1200));
  const overlap = Math.max(0, Math.min(400, opts?.overlapChars ?? 140));
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  const flush = () => {
    const chunk = current.join('\n').trim();
    if (chunk) blocks.push(chunk);
    current = [];
    currentLen = 0;
  };

  for (const line of lines) {
    const l = line.trimEnd();
    const isHeading = /^#{1,3}\s+/.test(l);
    const isBlank = l.trim() === '';
    const addLen = l.length + 1;

    if (isHeading && currentLen > maxChars * 0.65) flush();

    if (currentLen + addLen > maxChars) {
      flush();
      if (overlap > 0 && blocks.length > 0) {
        const prev = blocks[blocks.length - 1] ?? '';
        const tail = prev.slice(Math.max(0, prev.length - overlap));
        current.push(tail);
        currentLen += tail.length;
      }
    }

    if (!isBlank || currentLen > 0) {
      current.push(l);
      currentLen += addLen;
    }
  }
  flush();

  return blocks
    .map((c) => c.replace(/\n{3,}/g, '\n\n').trim())
    .filter((c) => c.length >= 160);
}

async function walkMarkdownFiles(absDir: string, opts?: { maxFiles?: number }): Promise<string[]> {
  const out: string[] = [];
  const maxFiles = Math.max(50, Math.min(5000, opts?.maxFiles ?? 1500));

  const walk = async (dir: string) => {
    if (out.length >= maxFiles) return;
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }> = [];
    try {
      entries = (await readdir(dir, { withFileTypes: true })) as unknown as typeof entries;
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= maxFiles) return;
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
        await walk(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
        out.push(full);
      }
    }
  };

  await walk(absDir);
  return out;
}

export async function collectKbSourceFiles(rootDir: string): Promise<KbSourceFile[]> {
  const roots = [
    path.join(rootDir, 'README.md'),
    path.join(rootDir, 'WHITEPAPER.md'),
    path.join(rootDir, 'ARCHITECTURE.md'),
    path.join(rootDir, 'RUNBOOK_PROD.md'),
    path.join(rootDir, 'SECURITY.md'),
    path.join(rootDir, 'CONTRIBUTING.md'),
  ];
  const docsDir = path.join(rootDir, 'docs');
  const docFiles = await walkMarkdownFiles(docsDir).catch(() => []);
  const all = [...roots, ...docFiles];

  const seen = new Set<string>();
  const out: KbSourceFile[] = [];
  for (const absPath of all) {
    const ap = path.resolve(absPath);
    if (seen.has(ap)) continue;
    seen.add(ap);
    let raw: string;
    try {
      raw = await readFile(ap, 'utf8');
    } catch {
      continue;
    }
    const normalized = normalizeText(raw);
    if (!normalized) continue;
    const relPath = path.relative(rootDir, ap).replace(/\\/g, '/');
    const title = firstHeading(raw) ?? path.basename(relPath);
    out.push({ absPath: ap, relPath, title, text: normalized });
  }
  return out;
}

export type KbChunk = {
  idHash: string;
  relPath: string;
  title: string;
  chunkIndex: number;
  text: string;
  embedding: { provider: EmbeddingProvider; model: string; vector: number[] };
};

export async function buildKbChunks(
  sources: KbSourceFile[],
  opts?: { embeddingProvider?: EmbeddingProvider },
): Promise<KbChunk[]> {
  const chunks: KbChunk[] = [];
  for (const s of sources) {
    const parts = chunkText(s.text);
    for (let i = 0; i < parts.length; i++) {
      const text = parts[i] ?? '';
      const idHash = sha256Hex(`kb:v1:${s.relPath}:${i}:${sha256Hex(text)}`);
      const embedding = await embedText(text, { provider: opts?.embeddingProvider });
      chunks.push({
        idHash,
        relPath: s.relPath,
        title: s.title,
        chunkIndex: i,
        text,
        embedding,
      });
    }
  }
  return chunks;
}
