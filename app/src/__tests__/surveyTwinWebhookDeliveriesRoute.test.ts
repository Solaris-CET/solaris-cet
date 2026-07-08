// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinWebhookDeliveriesEngineUrl,
  SURVEY_TWIN_WEBHOOK_DELIVERIES_PATH,
  SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE,
} from '../../api/lib/surveyTwinWebhookDeliveries';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinWebhookDeliveriesRoute, { SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE as routeProbe } from '../../api/survey/twin-webhook/deliveries/route';

function deliveriesRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_TWIN_WEBHOOK_DELIVERIES_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinWebhookDeliveries helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE.path).toBe('/api/survey/twin-webhook/deliveries');
    expect(routeProbe.directionParam).toBe('direction');
  });

  it('buildSurveyTwinWebhookDeliveriesEngineUrl includes direction', () => {
    expect(buildSurveyTwinWebhookDeliveriesEngineUrl('http://engine.test', 25, 'outbound')).toBe(
      'http://engine.test/twin-webhook/deliveries?limit=25&direction=outbound',
    );
  });
});

describe('/api/survey/twin-webhook/deliveries e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_WEBHOOK_DELIVERIES_PATH);
    expect(src).toContain('api/survey/twin-webhook/deliveries/route.js');
  });

  it('GET returns deliveries from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ deliveries: [{ id: 'd1' }] }),
    });
    const res = await surveyTwinWebhookDeliveriesRoute(deliveriesRequest('?limit=10&direction=outbound'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; deliveries: unknown[] };
    expect(body.platform).toBe('solaris-cet');
    expect(body.deliveries).toHaveLength(1);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinWebhookDeliveriesRoute(deliveriesRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_WEBHOOK_DELIVERIES_PROBE.unreachableError);
  });
});