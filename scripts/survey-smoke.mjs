/**
 * Smoke test survey stack — rulează cu survey-engine pornit pe :8000
 * Usage: node scripts/survey-smoke.mjs
 */
const ENGINE = (process.env.SURVEY_ENGINE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function check(path, opts = {}) {
  const url = `${ENGINE}${path}`;
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(120_000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

console.log(`Survey smoke → ${ENGINE}`);

const health = await check('/health');
console.log('✓ GET /health', health.ok ? 'ok' : health);

const dash = await check('/dashboard');
console.log('✓ GET /dashboard', `reports=${dash.stats?.total_reports ?? 0}`);

const demo = await check('/demo', { method: 'POST' });
console.log('✓ POST /demo', demo.report_id, `score=${demo.score}`);

const jurisdictions = await check('/jurisdictions');
console.log('✓ GET /jurisdictions', `count=${jurisdictions.jurisdictions?.length ?? 0}`);

const stats = await check('/stats');
console.log('✓ GET /stats', `reports=${stats.total_reports ?? 0}`);

console.log('\n✓ Survey engine smoke passed');