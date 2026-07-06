// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-webhook routes', () => {
  it('inbound route proxies to engine', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-webhook', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/twin-webhook/inbound');
    expect(src).toContain('X-Twin-Webhook-Secret');
  });

  it('deliveries route proxies to engine', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-webhook', 'deliveries', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/twin-webhook/deliveries');
    expect(src).toContain('direction');
  });
});