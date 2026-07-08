// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinEventsEngineUrl,
  SURVEY_TWIN_EVENTS_PATH,
  SURVEY_TWIN_EVENTS_PROBE,
} from '../../api/lib/surveyTwinEvents';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinEventsRoute, { SURVEY_TWIN_EVENTS_PROBE as routeProbe } from '../../api/survey/twin-events/route';

function twinEventsRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${SURVEY_TWIN_EVENTS_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinEvents helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_EVENTS_PROBE.path).toBe('/api/survey/twin-events');
    expect(routeProbe.authRequired).toBe(false);
  });

  it('buildSurveyTwinEventsEngineUrl builds list query', () => {
    expect(buildSurveyTwinEventsEngineUrl('http://engine.test', 50)).toBe('http://engine.test/twin-events?limit=50');
    expect(buildSurveyTwinEventsEngineUrl('http://engine.test', 20, 'rpt-1')).toBe(
      'http://engine.test/twin-events?limit=20&report_id=rpt-1',
    );
  });
});

describe('/api/survey/twin-events e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_EVENTS_PATH);
    expect(src).toContain('api/survey/twin-events/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyTwinEventsRoute(twinEventsRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns twin events from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [{ id: 'e1', type: 'correction' }] }),
    });
    const res = await surveyTwinEventsRoute(twinEventsRequest('?limit=25'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; events: unknown[] };
    expect(body.platform).toBe('solaris-cet');
    expect(body.events).toHaveLength(1);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinEventsRoute(twinEventsRequest());
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_EVENTS_PROBE.unreachableError);
  });
});