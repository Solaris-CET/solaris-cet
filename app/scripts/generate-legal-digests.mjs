import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');

function normalizeText(input) {
  return String(input).replace(/\r\n?/g, '\n').replace(/\n+$/g, '\n');
}

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function extractLastUpdated(markdown) {
  const s = normalizeText(markdown);
  if (!s.startsWith('---\n')) return null;
  const end = s.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const fm = s.slice(0, end + 1);
  const m = /\blastUpdated\s*:\s*([^\n]+)\n?/i.exec(fm);
  const raw = (m?.[1] ?? '').trim().replace(/^['"]|['"]$/g, '');
  return raw ? raw.slice(0, 40) : null;
}

async function digestCookies(locale) {
  const file = path.join(root, 'src', 'content', 'legal', locale, 'cookies.md');
  const raw = await readFile(file, 'utf8');
  const normalized = normalizeText(raw);
  const version = extractLastUpdated(normalized) ?? new Date().toISOString().slice(0, 10);
  const hash = sha256Hex(normalized);
  return { version, sha256: hash };
}

async function main() {
  const locales = ['en', 'ro', 'es'];
  const cookies = {};
  for (const locale of locales) {
    cookies[locale] = await digestCookies(locale);
  }

  const outFile = path.join(root, 'src', 'generated', 'legalDigests.ts');
  const payload = `export const LEGAL_DIGESTS = ${JSON.stringify({ cookies }, null, 2)} as const;\n`;
  await writeFile(outFile, payload, 'utf8');
}

main().catch((err) => {
  process.stderr.write(String(err?.stack ?? err) + '\n');
  process.exitCode = 1;
});

