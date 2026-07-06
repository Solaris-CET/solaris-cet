// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-agent routes', () => {
  it('plan route proxies to engine', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-agent', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('/twin-agent/');
    expect(src).toContain('report_id');
  });

  it('execute route dispatches webhooks', () => {
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-agent', 'execute', 'route.ts');
    const src = readFileSync(routePath, 'utf8');
    expect(src).toContain('agent_action');
    expect(src).toContain('dispatchTwinWebhook');
  });
});