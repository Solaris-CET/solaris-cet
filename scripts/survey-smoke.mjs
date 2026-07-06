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

const probe = await fetch(`${ENGINE}/openapi.json`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
const probeJson = probe?.ok ? await probe.json().catch(() => null) : null;
const hasS6 = Boolean(probeJson?.paths?.['/context/{report_id}'] || probeJson?.paths?.['/twin-feed/{report_id}']);
if (hasS6) {
  const ctx = await check(`/context/${demo.report_id}`);
  console.log('✓ GET /context', ctx.schema ?? 'ok');

  const orch = await check(`/orchestrate/${demo.report_id}`);
  console.log('✓ GET /orchestrate', orch.schema ?? 'ok');

  const twin = await check(`/twin-feed/${demo.report_id}`);
  console.log('✓ GET /twin-feed', twin.schema ?? 'ok');

  const openapi = await check('/openapi.json');
  console.log('✓ GET /openapi.json', openapi.info?.title ?? 'ok');

  if (openapi.paths?.['/twin-events']) {
    const events = await check('/twin-events?limit=5');
    console.log('✓ GET /twin-events', `total=${events.total ?? 0}`);
    const streamRes = await fetch(`${ENGINE}/twin-stream/${demo.report_id}`, { signal: AbortSignal.timeout(15_000) });
    if (!streamRes.ok) throw new Error(`/twin-stream → ${streamRes.status}`);
    const streamText = await streamRes.text();
    if (!streamText.includes('event: snapshot')) throw new Error('twin-stream missing snapshot event');
    console.log('✓ GET /twin-stream', 'snapshot ok');
  }
} else {
  console.log('⚠ S6 extended checks skipped — repornește survey-engine (cod nou pe :8000)');
}

console.log('\n✓ Survey engine smoke passed');