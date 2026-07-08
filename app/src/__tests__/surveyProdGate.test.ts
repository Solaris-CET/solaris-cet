// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildGateUrl,
  isCriticalGateRoute,
  listSurveyBridgePaths,
  missingOpenApiPaths,
  OPENAPI_GATE_REQUIRED_PATHS,
  SURVEY_GATE_CRITICAL_PATHS,
  uncoveredCriticalPaths,
} from '../../api/lib/surveyProdGate';
import { SURVEY_ROUTE_IDS, surveyBridgePath } from '../../api/lib/surveyOpenApi';

const repoRoot = join(process.cwd(), '..');

describe('survey prod gate manifest alignment', () => {
  it('OpenAPI route ids cover gate critical paths', () => {
    const paths = listSurveyBridgePaths();
    const missing = uncoveredCriticalPaths(paths);
    expect(missing, `missing critical: ${missing.join(', ')}`).toEqual([]);

    for (const id of SURVEY_ROUTE_IDS) {
      expect(paths).toContain(surveyBridgePath(id));
    }

    const indexSrc = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(indexSrc).toContain('/api/openapi/survey');
  });

  it('OPENAPI_GATE_REQUIRED_PATHS are declared in OpenAPI spec', () => {
    const missing = missingOpenApiPaths(OPENAPI_GATE_REQUIRED_PATHS);
    expect(missing, `OpenAPI missing: ${missing.join(', ')}`).toEqual([]);
  });

  it('buildGateUrl appends probe query params', () => {
    const url = buildGateUrl('https://solaris-cet.com', {
      path: '/api/survey/twin-events',
      probeQuery: { report_id: 'SOL-1', limit: '5' },
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://solaris-cet.com/api/survey/twin-events');
    expect(parsed.searchParams.get('report_id')).toBe('SOL-1');
    expect(parsed.searchParams.get('limit')).toBe('5');
  });

  it('isCriticalGateRoute identifies hard-fail routes', () => {
    expect(
      isCriticalGateRoute({
        path: SURVEY_GATE_CRITICAL_PATHS[0],
        method: 'GET',
        label: 'health',
        critical: true,
      }),
    ).toBe(true);
    expect(
      isCriticalGateRoute({
        path: '/api/survey/dashboard',
        method: 'GET',
        label: 'dashboard',
        critical: false,
      }),
    ).toBe(false);
  });

  it('survey-prod-gate script exists and references manifest', () => {
    const gatePath = join(repoRoot, 'scripts', 'survey-prod-gate.mjs');
    const src = readFileSync(gatePath, 'utf8');
    expect(src).toContain('surveyRouteManifest');
    expect(src).toContain('SURVEY_GATE_ROUTES');
    expect(src).toContain('SOFT_FAIL');
    expect(src).toContain('probeExtendedFlow');
  });

  it('scripts manifest stays aligned with OPENAPI_GATE_REQUIRED_PATHS', async () => {
    const manifest = await import('../../../scripts/lib/surveyRouteManifest.mjs');
    expect(manifest.OPENAPI_REQUIRED_PATHS).toEqual([...OPENAPI_GATE_REQUIRED_PATHS]);

    const criticalFromManifest = manifest.SURVEY_GATE_ROUTES.filter(
      (route: { critical: boolean }) => route.critical,
    ).map((route: { path: string }) => route.path);

    for (const path of SURVEY_GATE_CRITICAL_PATHS) {
      expect(criticalFromManifest).toContain(path);
    }
    expect(criticalFromManifest).toContain('/api/openapi/survey');
  });

  it('extended flow paths from gate script exist in OpenAPI', () => {
    const gateSrc = readFileSync(join(repoRoot, 'scripts', 'survey-prod-gate.mjs'), 'utf8');
    const extendedPaths = [
      '/api/survey/demo',
      '/api/survey/context',
      '/api/survey/orchestrate',
      '/api/survey/twin-feed',
      '/api/survey/twin-events',
    ];
    for (const path of extendedPaths) {
      expect(gateSrc).toContain(path);
    }
    const missing = missingOpenApiPaths(extendedPaths.filter((p) => p !== '/api/survey/demo'));
    expect(missing).toEqual([]);
  });
});