// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('offline-manifest route', () => {
  it('proxies engine offline-hints', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'offline-manifest', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/offline-hints');
    expect(src).toContain('buildSurveyOfflineManifest');
  });
});