// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SURVEY_ROUTE_IDS, buildSurveyOpenApiPaths, buildSurveyOpenApiSpec, surveyBridgePath } from '../../api/lib/surveyOpenApi';

describe('surveyOpenApi', () => {
  it('includes all survey bridge routes', () => {
    const paths = buildSurveyOpenApiPaths();
    for (const id of SURVEY_ROUTE_IDS) {
      expect(paths[surveyBridgePath(id)], `missing route for ${id}`).toBeTruthy();
    }
  });

  it('buildSurveyOpenApiSpec has survey title', () => {
    const spec = buildSurveyOpenApiSpec() as { info: { title: string } };
    expect(spec.info.title).toContain('Survey');
  });
});