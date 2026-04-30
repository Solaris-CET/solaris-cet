import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const appDir = path.join(root, 'app');
const outDir = path.join(appDir, '.lighthouseci');
const scoresJsonPath = path.join(appDir, 'public', 'lighthouse-scores.json');
const badgePath = path.join(appDir, 'public', 'lighthouse-badge.svg');

async function resolveChromePath() {
  const fromEnv = String(process.env.LHCI_CHROME_PATH || process.env.CHROME_PATH || '').trim();
  if (fromEnv) return fromEnv;

  try {
    const m = await import('playwright');
    const p = m?.chromium?.executablePath?.();
    if (typeof p === 'string' && p.trim()) return p.trim();
  } catch {
    void 0;
  }

  return '';
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function pickColor(score100) {
  if (score100 >= 90) return '#22c55e';
  if (score100 >= 75) return '#f59e0b';
  return '#ef4444';
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBadge(label, value, color) {
  const left = 82;
  const right = 46;
  const w = left + right;
  const h = 20;
  const font = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${escapeXml(
    `${label}: ${value}`,
  )}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".07"/>
    <stop offset="1" stop-opacity=".07"/>
  </linearGradient>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="6" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${left}" height="${h}" fill="#0b1220"/>
    <rect x="${left}" width="${right}" height="${h}" fill="${escapeXml(color)}"/>
    <rect width="${w}" height="${h}" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="${escapeXml(font)}" font-size="11" font-weight="600">
    <text x="${left / 2}" y="14">${escapeXml(label)}</text>
    <text x="${left + right / 2}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`;
}

fs.rmSync(outDir, { recursive: true, force: true });

const chromePath = await resolveChromePath();

run('npm', ['run', 'build', '--workspace=app'], {
  env: { ...process.env, VITE_LHCI: '1' },
});

run('npx', ['@lhci/cli@0.15.1', 'autorun', '--config=lighthouserc.cjs'], {
  cwd: appDir,
  env: {
    ...process.env,
    ...(chromePath ? { CHROME_PATH: chromePath } : {}),
  },
});

const manifestPath = path.join(outDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('Missing LHCI manifest:', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const first = Array.isArray(manifest) ? manifest[0] : null;
const jsonPath = first && typeof first.jsonPath === 'string' ? first.jsonPath : '';
if (!jsonPath) {
  console.error('Could not find jsonPath in LHCI manifest');
  process.exit(1);
}
const reportPath = path.isAbsolute(jsonPath) ? jsonPath : path.join(appDir, jsonPath);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const perf = Math.round(clamp01(report?.categories?.performance?.score) * 100);
const a11y = Math.round(clamp01(report?.categories?.accessibility?.score) * 100);
const bp = Math.round(clamp01(report?.categories?.['best-practices']?.score) * 100);
const seo = Math.round(clamp01(report?.categories?.seo?.score) * 100);
const avg = Math.round((perf + a11y + bp + seo) / 4);

const payload = {
  generatedAt: new Date().toISOString(),
  url: typeof first?.url === 'string' ? first.url : null,
  scores: {
    performance: perf,
    accessibility: a11y,
    bestPractices: bp,
    seo,
    average: avg,
  },
};

fs.writeFileSync(scoresJsonPath, JSON.stringify(payload, null, 2) + '\n');
fs.writeFileSync(badgePath, renderBadge('Lighthouse', String(avg), pickColor(avg)));

console.log('Wrote:', scoresJsonPath);
console.log('Wrote:', badgePath);
