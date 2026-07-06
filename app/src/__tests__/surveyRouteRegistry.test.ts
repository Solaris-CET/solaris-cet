// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SURVEY_ROUTE_IDS } from '../../api/lib/surveyOpenApi';

describe('survey route registry', () => {
  it('server index registers all survey bridge routes', () => {
    const indexPath = join(process.cwd(), 'server', 'index.cjs');
    const src = readFileSync(indexPath, 'utf8');
    for (const id of SURVEY_ROUTE_IDS) {
      const path = id === 'permit-pack' ? '/api/survey/permit-pack' : `/api/survey/${id}`;
      expect(src, `missing ${path} in server/index.cjs`).toContain(path);
    }
    expect(src).toContain('/api/openapi/survey');
    expect(src).toContain('/api/admin/survey-insights');
  });
});