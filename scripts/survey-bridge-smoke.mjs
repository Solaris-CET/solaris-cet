/**
 * Local Node bridge smoke — health, openapi, installer/me, twin-feed probe.
 * Usage: npm run survey:bridge-smoke
 * Prerequisite: survey-engine on :8000, Node API on :3000 or :5173 proxy
 */
const BASE = (process.env.BRIDGE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

const ROUTES = [
  { path: '/api/survey/health', label: 'health' },
  { path: '/api/openapi/survey', label: 'openapi' },
  { path: '/api/survey/installer/me', label: 'installer-me' },
];

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(10_000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${path} → invalid JSON (${res.status})`);
  }
  return { res, body };
}

console.log(`Survey bridge smoke → ${BASE}`);

for (const route of ROUTES) {
  const { res, body } = await get(route.path);
  if (!res.ok) {
    throw new Error(`${route.label} → HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  console.log(`✓ ${route.path}`, JSON.stringify(body).slice(0, 100));
}

const openapi = (await get('/api/openapi/survey')).body;
const paths = openapi.paths ?? {};
if (!paths['/api/survey/installer/me']) {
  throw new Error('openapi missing /api/survey/installer/me');
}
if (!paths['/api/survey/twin-feed']) {
  throw new Error('openapi missing /api/survey/twin-feed');
}
if (!paths['/api/survey/twin-events']) {
  throw new Error('openapi missing /api/survey/twin-events');
}
if (!paths['/api/survey/twin-stream']) {
  throw new Error('openapi missing /api/survey/twin-stream');
}
if (!paths['/api/survey/twin-webhook']) {
  throw new Error('openapi missing /api/survey/twin-webhook');
}
if (!paths['/api/survey/twin-webhook/deliveries']) {
  throw new Error('openapi missing /api/survey/twin-webhook/deliveries');
}
if (!paths['/api/survey/twin-agent']) {
  throw new Error('openapi missing /api/survey/twin-agent');
}
if (!paths['/api/survey/twin-agent/execute']) {
  throw new Error('openapi missing /api/survey/twin-agent/execute');
}
console.log('✓ openapi paths include twin runtime + webhook + agent routes');

console.log('\n✓ Survey bridge smoke passed');