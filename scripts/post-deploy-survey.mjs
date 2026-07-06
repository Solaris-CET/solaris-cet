/**
 * Post-deploy smoke — verifică bridge-ul Node → survey-engine în producție.
 * Usage:
 *   SITE_URL=https://solaris-cet.com node scripts/post-deploy-survey.mjs
 */
const SITE = (process.env.SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '');

const ROUTES = [
  { path: '/api/survey/health', label: 'health', required: ['engine'] },
  { path: '/api/survey/jurisdictions', label: 'jurisdictions', required: ['jurisdictions'] },
  { path: '/api/survey/stats', label: 'stats', required: ['stats'] },
  { path: '/api/openapi/survey', label: 'openapi-survey', required: ['paths'] },
];

async function check(route) {
  const url = `${SITE}${route.path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${route.label} → invalid JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`${route.label} → HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  for (const key of route.required) {
    if (body[key] == null) {
      throw new Error(`${route.label} → missing field "${key}"`);
    }
  }
  return body;
}

async function checkTwinFeedOptional() {
  const demoRes = await fetch(`${SITE}/api/survey/demo`, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
  });
  if (!demoRes.ok) {
    console.log('⚠ twin-feed — demo unavailable, skip');
    return;
  }
  const demo = await demoRes.json();
  const reportId = demo.report_id;
  if (!reportId) {
    console.log('⚠ twin-feed — no report_id from demo, skip');
    return;
  }
  const ctxRes = await fetch(`${SITE}/api/survey/context?report_id=${encodeURIComponent(reportId)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!ctxRes.ok) {
    console.log(`⚠ context — HTTP ${ctxRes.status}, skip twin-feed`);
    return;
  }
  const twinRes = await fetch(`${SITE}/api/survey/twin-feed?report_id=${encodeURIComponent(reportId)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const twin = await twinRes.json();
  if (!twinRes.ok || !twin.feed) {
    throw new Error(`twin-feed → HTTP ${twinRes.status}: ${JSON.stringify(twin)}`);
  }
  console.log(`✓ /api/survey/twin-feed`, JSON.stringify({ schema: twin.feed.schema, report_id: reportId }).slice(0, 120));
}

console.log(`Post-deploy survey smoke → ${SITE}`);

for (const route of ROUTES) {
  const body = await check(route);
  console.log(`✓ ${route.path}`, JSON.stringify(body).slice(0, 120));
}

await checkTwinFeedOptional();

console.log('\n✓ Post-deploy survey smoke passed');