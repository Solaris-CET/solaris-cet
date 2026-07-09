// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('router-stats route', () => {
  it('proxies to engine /router/stats', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyRouterStats.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'router', 'stats', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/router/stats');
    expect(routeSrc).toContain('buildSurveyRouterStatsEngineUrl');
  });
});