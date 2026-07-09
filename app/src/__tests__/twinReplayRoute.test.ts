// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-replay route', () => {
  it('proxies to engine /twin-replay with from_seq', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinReplay.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-replay', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/twin-replay');
    expect(libSrc).toContain('from_seq');
    expect(routeSrc).toContain('buildSurveyTwinReplayEngineUrl');
  });
});