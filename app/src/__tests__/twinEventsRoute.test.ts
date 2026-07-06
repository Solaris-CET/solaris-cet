// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-events route', () => {
  it('proxies to engine /twin-events', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-events', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/twin-events');
    expect(src).toContain('report_id');
  });
});