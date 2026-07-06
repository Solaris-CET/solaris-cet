// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SURVEY_ROUTE_IDS, surveyBridgePath } from '../../api/lib/surveyOpenApi';

const SURVEY_BRIDGE_CRITICAL = [
  '/api/survey/health',
  '/api/survey/jurisdictions',
  '/api/survey/stats',
];

describe('survey prod gate manifest alignment', () => {
  it('OpenAPI route ids cover gate critical paths', () => {
    const paths = SURVEY_ROUTE_IDS.map((id) => surveyBridgePath(id));
    for (const critical of SURVEY_BRIDGE_CRITICAL) {
      expect(paths, `missing ${critical}`).toContain(critical);
    }
    const indexSrc = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(indexSrc).toContain('/api/openapi/survey');
  });

  it('survey-prod-gate script exists and references manifest', () => {
    const gatePath = join(process.cwd(), '..', 'scripts', 'survey-prod-gate.mjs');
    const src = readFileSync(gatePath, 'utf8');
    expect(src).toContain('surveyRouteManifest');
    expect(src).toContain('SURVEY_GATE_ROUTES');
  });
});