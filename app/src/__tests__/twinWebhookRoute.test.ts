// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('twin-webhook routes', () => {
  it('inbound route proxies to engine', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinWebhookInbound.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-webhook', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/twin-webhook/inbound');
    expect(libSrc).toContain('X-Twin-Webhook-Secret');
    expect(routeSrc).toContain('buildSurveyTwinWebhookInboundHeaders');
  });

  it('deliveries route proxies to engine', () => {
    const libPath = join(process.cwd(), 'api', 'lib', 'surveyTwinWebhookDeliveries.ts');
    const routePath = join(process.cwd(), 'api', 'survey', 'twin-webhook', 'deliveries', 'route.ts');
    const libSrc = readFileSync(libPath, 'utf8');
    const routeSrc = readFileSync(routePath, 'utf8');
    expect(libSrc).toContain('/twin-webhook/deliveries');
    expect(libSrc).toContain('direction');
    expect(routeSrc).toContain('buildSurveyTwinWebhookDeliveriesEngineUrl');
  });
});