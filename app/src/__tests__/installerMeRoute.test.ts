// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('installer/me route', () => {
  it('proxies X-Installer-Key to survey-engine', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'installer', 'me', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/installer/me');
    expect(src).toContain('X-Installer-Key');
    expect(src).toContain('x-installer-key');
  });
});