// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-events route', () => {
  it('proxies to engine /twin-events', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinEvents.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-events', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/twin-events');
    expect(libSrc).toContain('reportIdParam');
    expect(routeSrc).toContain('buildSurveyTwinEventsEngineUrl');
  });
});