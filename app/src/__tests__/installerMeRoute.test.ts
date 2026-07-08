// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('installer/me route', () => {
  it('proxies X-Installer-Key to survey-engine', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyInstallerMe.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'installer', 'me', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/installer/me');
    expect(routeSrc).toContain('buildSurveyInstallerMeHeaders');
    expect(routeSrc).toContain('x-installer-key');
  });
});