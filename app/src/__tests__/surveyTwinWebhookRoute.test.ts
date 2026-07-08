// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseTwinWebhookInboundBody,
  SURVEY_TWIN_WEBHOOK_PATH,
  SURVEY_TWIN_WEBHOOK_PROBE,
  validateTwinWebhookSecret,
} from '../../api/lib/surveyTwinWebhookInbound';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinWebhookRoute, { SURVEY_TWIN_WEBHOOK_PROBE as routeProbe } from '../../api/survey/twin-webhook/route';

function webhookRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  headers.set('X-Twin-Webhook-Secret', 'secret-1');
  return new Request(`http://test${SURVEY_TWIN_WEBHOOK_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('surveyTwinWebhookInbound helpers', () => {
  beforeEach(() => {
    process.env.TWIN_WEBHOOK_SECRET = 'secret-1';
  });

  afterEach(() => {
    delete process.env.TWIN_WEBHOOK_SECRET;
  });

  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_WEBHOOK_PROBE.path).toBe('/api/survey/twin-webhook');
    expect(routeProbe.defaultEvent).toBe('crm_sync');
  });

  it('parseTwinWebhookInboundBody extracts report and event', () => {
    expect(parseTwinWebhookInboundBody({ report_id: 'rpt-1', event: 'sync', foo: 'bar' })).toEqual({
      reportId: 'rpt-1',
      event: 'sync',
      payload: { foo: 'bar' },
    });
    expect(parseTwinWebhookInboundBody({})).toBeNull();
  });

  it('validateTwinWebhookSecret checks header', () => {
    const req = new Request('http://test', { headers: { 'X-Twin-Webhook-Secret': 'secret-1' } });
    expect(validateTwinWebhookSecret(req, 'secret-1')).toBe(true);
    expect(validateTwinWebhookSecret(req, 'other')).toBe(false);
  });
});

describe('/api/survey/twin-webhook e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    process.env.TWIN_WEBHOOK_SECRET = 'secret-1';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TWIN_WEBHOOK_SECRET;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_WEBHOOK_PATH);
    expect(src).toContain('api/survey/twin-webhook/route.js');
  });

  it('POST without report_id returns 400', async () => {
    const res = await surveyTwinWebhookRoute(webhookRequest({ event: 'sync' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_WEBHOOK_PROBE.missingReportIdError);
  });

  it('POST with invalid secret returns 401', async () => {
    const headers = new Headers({
      origin: 'https://allowed.test',
      'Content-Type': 'application/json',
      'X-Twin-Webhook-Secret': 'wrong',
    });
    const res = await surveyTwinWebhookRoute(
      new Request(`http://test${SURVEY_TWIN_WEBHOOK_PATH}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ report_id: 'rpt-1' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('POST forwards inbound webhook to engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, accepted: true }),
    });
    const res = await surveyTwinWebhookRoute(webhookRequest({ report_id: 'rpt-1', event: 'sync', note: 'x' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; accepted: boolean };
    expect(body.platform).toBe('solaris-cet');
    expect(body.accepted).toBe(true);
  });
});