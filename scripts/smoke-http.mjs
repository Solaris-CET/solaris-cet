function parseArgs(argv) {
  const out = {
    baseUrl: 'https://solaris-cet.com',
    metricsToken: null,
    timeoutMs: 8000,
  };
  for (const a of argv) {
    if (a.startsWith('--base=')) out.baseUrl = a.slice('--base='.length).trim();
    if (a.startsWith('--metrics-token=')) out.metricsToken = a.slice('--metrics-token='.length).trim();
    if (a.startsWith('--timeout-ms=')) out.timeoutMs = Number.parseInt(a.slice('--timeout-ms='.length), 10);
  }
  if (!Number.isFinite(out.timeoutMs) || out.timeoutMs <= 0) out.timeoutMs = 8000;
  out.baseUrl = out.baseUrl.replace(/\/+$/, '');
  return out;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => '');
  try {
    return { ok: true, json: text ? JSON.parse(text) : null, text };
  } catch {
    return { ok: false, json: null, text };
  }
}

function okLine(label) {
  process.stdout.write(`OK  ${label}\n`);
}
function badLine(label, detail) {
  process.stderr.write(`BAD ${label}${detail ? ` — ${detail}` : ''}\n`);
}

const args = parseArgs(process.argv.slice(2));

const checks = [];

checks.push(async () => {
  const url = `${args.baseUrl}/health.json`;
  const res = await fetchWithTimeout(url, { headers: { accept: 'application/json' } }, args.timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const parsed = await readJsonSafe(res);
  if (!parsed.ok) throw new Error('Invalid JSON');
  const status = String(parsed.json?.status ?? '').toLowerCase();
  if (status !== 'healthy') throw new Error(`status=${status || 'missing'}`);
  okLine('/health.json');
});

checks.push(async () => {
  const url = `${args.baseUrl}/api/metrics`;
  const res = await fetchWithTimeout(url, { headers: { accept: 'application/json' } }, args.timeoutMs);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const parsed = await readJsonSafe(res);
  if (!parsed.ok) throw new Error('Invalid JSON');
  okLine('/api/metrics');
});

checks.push(async () => {
  const url = `${args.baseUrl}/metrics`;
  const headers = { accept: 'text/plain' };
  if (args.metricsToken) headers.authorization = `Bearer ${args.metricsToken}`;
  const res = await fetchWithTimeout(url, { headers }, args.timeoutMs);
  if (args.metricsToken) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!/\n/.test(text) || !/#[ ]?HELP|#[ ]?TYPE|solaris_/i.test(text)) throw new Error('Unexpected metrics body');
    okLine('/metrics (auth)');
    return;
  }
  if (res.status === 401 || res.status === 403) {
    okLine('/metrics (protected)');
    return;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  okLine('/metrics (public)');
});

let failed = false;
for (const fn of checks) {
  try {
    await fn();
  } catch (e) {
    failed = true;
    badLine('check', e instanceof Error ? e.message : String(e));
  }
}

process.stdout.write(`Base: ${args.baseUrl}\n`);
if (failed) process.exit(1);
