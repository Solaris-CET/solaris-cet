// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSurveyTwinFeedEngineUrl,
  parseSurveyTwinFeedReportId,
  SURVEY_TWIN_FEED_PATH,
  SURVEY_TWIN_FEED_PROBE,
} from '../../api/lib/surveyTwinFeed';

const fetchMock = vi.fn();

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

import surveyTwinFeedRoute, { SURVEY_TWIN_FEED_PROBE as routeProbe } from '../../api/survey/twin-feed/route';

function twinFeedRequest(reportId?: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  const query = reportId ? `?report_id=${encodeURIComponent(reportId)}` : '';
  return new Request(`http://test${SURVEY_TWIN_FEED_PATH}${query}`, { method: 'GET', ...init, headers });
}

describe('surveyTwinFeed helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SURVEY_TWIN_FEED_PROBE.path).toBe('/api/survey/twin-feed');
    expect(routeProbe.cacheControl).toContain('max-age=120');
  });

  it('parseSurveyTwinFeedReportId validates report id', () => {
    expect(parseSurveyTwinFeedReportId('rpt-1')).toBe('rpt-1');
    expect(parseSurveyTwinFeedReportId('')).toBeNull();
  });

  it('buildSurveyTwinFeedEngineUrl encodes report id', () => {
    expect(buildSurveyTwinFeedEngineUrl('http://engine.test', 'rpt 1')).toBe('http://engine.test/twin-feed/rpt%201');
  });
});

describe('/api/survey/twin-feed e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SURVEY_TWIN_FEED_PATH);
    expect(src).toContain('api/survey/twin-feed/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await surveyTwinFeedRoute(twinFeedRequest('rpt-1', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without report_id returns 400', async () => {
    const res = await surveyTwinFeedRoute(twinFeedRequest());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_FEED_PROBE.missingReportIdError);
  });

  it('GET returns twin feed from engine', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: 'f1', message: 'update' }] }),
    });
    const res = await surveyTwinFeedRoute(twinFeedRequest('rpt-1'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; feed: { items: unknown[] } };
    expect(body.platform).toBe('solaris-cet');
    expect(body.feed.items).toHaveLength(1);
  });

  it('GET returns 503 when engine unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await surveyTwinFeedRoute(twinFeedRequest('rpt-1'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SURVEY_TWIN_FEED_PROBE.unreachableError);
  });
});