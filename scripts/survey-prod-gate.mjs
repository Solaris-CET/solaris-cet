/**
 * Production deploy gate — verifică toate rutele survey bridge critice.
 * Usage:
 *   SITE_URL=https://solaris-cet.com node scripts/survey-prod-gate.mjs
 *   SOFT_FAIL=1 node scripts/survey-prod-gate.mjs   # warn on optional 404, exit 0 if critical OK
 */
import { OPENAPI_REQUIRED_PATHS, SURVEY_GATE_ROUTES, buildGateUrl } from './lib/surveyRouteManifest.mjs';

const SITE = (process.env.SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://solaris-cet.com').replace(/\/$/, '');
const SOFT_FAIL = ['1', 'true', 'yes'].includes(String(process.env.SOFT_FAIL ?? '').toLowerCase());
const JSON_OUT = process.argv.includes('--json');
const TIMEOUT_MS = Number(process.env.GATE_TIMEOUT_MS || 15_000);

const results = [];
let hardFailures = 0;
let softFailures = 0;

async function probeRoute(route) {
  const url = buildGateUrl(SITE, route);
  const started = Date.now();
  try {
    const res = await fetch(url, { method: route.method, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    const ok = res.ok && body != null;
    if (ok && route.required) {
      for (const key of route.required) {
        if (body[key] == null) {
          return { ok: false, status: res.status, error: `missing field "${key}"`, ms: Date.now() - started };
        }
      }
    }
    if (!ok && res.ok) {
      return { ok: false, status: res.status, error: 'invalid JSON', ms: Date.now() - started };
    }
    if (!res.ok) {
      return { ok: false, status: res.status, error: text.slice(0, 120), ms: Date.now() - started };
    }
    return { ok: true, status: res.status, body, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, error: err instanceof Error ? err.message : String(err), ms: Date.now() - started };
  }
}

async function probeOpenApiPaths() {
  const url = `${SITE}/api/openapi/survey`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return { ok: false, missing: OPENAPI_REQUIRED_PATHS };
  const spec = await res.json();
  const paths = spec.paths ?? {};
  const missing = OPENAPI_REQUIRED_PATHS.filter((p) => !paths[p]);
  return { ok: missing.length === 0, missing, paths: Object.keys(paths).length };
}

async function probeExtendedFlow() {
  const demoRes = await fetch(`${SITE}/api/survey/demo`, { method: 'POST', signal: AbortSignal.timeout(45_000) });
  if (!demoRes.ok) return { ok: false, skipped: true, reason: `demo HTTP ${demoRes.status}` };
  const demo = await demoRes.json();
  const reportId = demo.report_id;
  if (!reportId) return { ok: false, skipped: true, reason: 'no report_id' };

  const checks = [
    `/api/survey/context?report_id=${encodeURIComponent(reportId)}`,
    `/api/survey/orchestrate?report_id=${encodeURIComponent(reportId)}`,
    `/api/survey/twin-feed?report_id=${encodeURIComponent(reportId)}`,
    `/api/survey/twin-events?report_id=${encodeURIComponent(reportId)}&limit=5`,
  ];
  const failed = [];
  for (const path of checks) {
    const res = await fetch(`${SITE}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) failed.push(`${path} → ${res.status}`);
  }
  return { ok: failed.length === 0, reportId, failed };
}

console.log(`Survey prod gate → ${SITE}${SOFT_FAIL ? ' (SOFT_FAIL)' : ''}`);

for (const route of SURVEY_GATE_ROUTES) {
  const probe = await probeRoute(route);
  const entry = { path: route.path, critical: route.critical, ...probe };
  results.push(entry);
  if (probe.ok) {
    console.log(`✓ ${route.path} (${probe.ms}ms)`);
    continue;
  }
  const msg = `✗ ${route.path} → ${probe.status || 'ERR'} ${probe.error ?? ''}`;
  if (route.critical) {
    hardFailures += 1;
    console.log(msg);
  } else {
    softFailures += 1;
    console.log(SOFT_FAIL ? `⚠ ${msg}` : msg);
    if (!SOFT_FAIL) hardFailures += 1;
  }
}

const openapiProbe = await probeOpenApiPaths();
results.push({ path: 'openapi-paths', critical: true, ...openapiProbe });
if (openapiProbe.ok) {
  console.log(`✓ openapi paths (${openapiProbe.paths} total)`);
} else {
  hardFailures += 1;
  console.log(`✗ openapi missing paths: ${openapiProbe.missing?.join(', ')}`);
}

const extended = await probeExtendedFlow();
results.push({ path: 'extended-flow', critical: false, ...extended });
if (extended.skipped) {
  console.log(`⚠ extended flow skipped — ${extended.reason}`);
} else if (extended.ok) {
  console.log(`✓ extended flow report_id=${extended.reportId}`);
} else {
  softFailures += 1;
  const line = `✗ extended flow: ${extended.failed?.join('; ')}`;
  console.log(SOFT_FAIL ? `⚠ ${line}` : line);
  if (!SOFT_FAIL) hardFailures += 1;
}

const summary = {
  site: SITE,
  soft_fail: SOFT_FAIL,
  hard_failures: hardFailures,
  soft_failures: softFailures,
  passed: hardFailures === 0,
  results,
};

if (JSON_OUT) {
  console.log(JSON.stringify(summary, null, 2));
}

if (hardFailures > 0) {
  console.log(`\n✗ Survey prod gate FAILED (${hardFailures} hard, ${softFailures} soft)`);
  process.exit(1);
}

console.log(`\n✓ Survey prod gate passed (${softFailures} soft warnings)`);
process.exit(0);