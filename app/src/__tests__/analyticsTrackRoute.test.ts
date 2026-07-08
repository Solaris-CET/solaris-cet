// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ANALYTICS_TRACK_PATH,
  ANALYTICS_TRACK_PROBE,
  analyticsDayKeyUtc,
  parseAnalyticsEventsBody,
  parseIncomingAnalyticsEvent,
} from '../../api/lib/analyticsTrack';

const trackMocks = vi.hoisted(() => ({
  inserted: 0,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => ({ error: 'Unauthorized', status: 401 }),
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values: async () => {
          trackMocks.inserted += 1;
        },
      };
    },
  }),
  schema: {
    analyticsEvents: {
      userId: 'analyticsEvents.userId',
      anonId: 'analyticsEvents.anonId',
      sessionId: 'analyticsEvents.sessionId',
      name: 'analyticsEvents.name',
    },
  },
}));

import analyticsTrackRoute, { ANALYTICS_TRACK_PROBE as routeProbe } from '../../api/analytics/track/route';

function trackRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${ANALYTICS_TRACK_PATH}`, { ...init, headers });
}

describe('analyticsTrack helpers', () => {
  it('parseIncomingAnalyticsEvent validates required fields', () => {
    expect(
      parseIncomingAnalyticsEvent({ name: 'page_view', anonId: 'anon-1', sessionId: 'sess-1' }),
    ).toEqual({ name: 'page_view', anonId: 'anon-1', sessionId: 'sess-1', ts: undefined, props: undefined, pagePath: undefined, referrer: undefined });
    expect(parseIncomingAnalyticsEvent({ name: '', anonId: 'a', sessionId: 's' })).toBeNull();
  });

  it('parseAnalyticsEventsBody enforces list bounds', () => {
    expect(parseAnalyticsEventsBody({ events: [] })).toEqual({ ok: false, error: ANALYTICS_TRACK_PROBE.missingEventsError });
    expect(
      parseAnalyticsEventsBody({
        events: [{ name: 'click', anonId: 'a1', sessionId: 's1' }],
      }),
    ).toEqual({
      ok: true,
      events: [{ name: 'click', anonId: 'a1', sessionId: 's1', ts: undefined, props: undefined, pagePath: undefined, referrer: undefined }],
    });
  });

  it('analyticsDayKeyUtc formats UTC day', () => {
    expect(analyticsDayKeyUtc(new Date('2026-03-15T12:00:00.000Z'))).toBe('2026-03-15');
  });

  it('exports stable e2e probe contract', () => {
    expect(ANALYTICS_TRACK_PROBE.path).toBe('/api/analytics/track');
    expect(routeProbe.rateLimitKey).toBe('analytics_track');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/analytics/track e2e probe', () => {
  beforeEach(() => {
    trackMocks.inserted = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ANALYTICS_TRACK_PATH);
    expect(src).toContain('api/analytics/track/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await analyticsTrackRoute(trackRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects empty events', async () => {
    const res = await analyticsTrackRoute(
      trackRequest({ method: 'POST', body: JSON.stringify({ events: [] }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(ANALYTICS_TRACK_PROBE.missingEventsError);
  });

  it('POST ingests valid events without auth', async () => {
    const res = await analyticsTrackRoute(
      trackRequest({
        method: 'POST',
        body: JSON.stringify({ events: [{ name: 'page_view', anonId: 'anon-1', sessionId: 'sess-1' }] }),
      }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok: boolean; ingested: number };
    expect(body.ok).toBe(true);
    expect(body.ingested).toBe(1);
    expect(trackMocks.inserted).toBe(1);
  });

  it('GET returns 405', async () => {
    const res = await analyticsTrackRoute(trackRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});