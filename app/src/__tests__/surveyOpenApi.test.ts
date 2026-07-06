// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SURVEY_ROUTE_IDS, buildSurveyOpenApiPaths, buildSurveyOpenApiSpec } from '../../api/lib/surveyOpenApi';

describe('surveyOpenApi', () => {
  it('includes all survey bridge routes', () => {
    const paths = buildSurveyOpenApiPaths();
    for (const id of SURVEY_ROUTE_IDS) {
      const match = Object.keys(paths).some((p) => p.includes(id === 'permit-pack' ? 'permit-pack' : id));
      expect(match, `missing route for ${id}`).toBe(true);
    }
  });

  it('buildSurveyOpenApiSpec has survey title', () => {
    const spec = buildSurveyOpenApiSpec() as { info: { title: string } };
    expect(spec.info.title).toContain('Survey');
  });
});