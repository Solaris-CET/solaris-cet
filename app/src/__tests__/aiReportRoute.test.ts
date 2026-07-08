// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AI_REPORT_PATH, AI_REPORT_PROBE, parseReportBody } from '../../api/lib/aiReport';

const reportMocks = vi.hoisted(() => ({
  inserted: { id: 'rep-1' },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withUpstashRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => ({ error: 'Unauthorized', status: 401 }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values() {
          return {
            returning: async () => [reportMocks.inserted],
          };
        },
      };
    },
  }),
  schema: {
    aiReports: {
      id: 'aiReports.id',
      userId: 'aiReports.userId',
      messageId: 'aiReports.messageId',
      queryHash: 'aiReports.queryHash',
      responseHash: 'aiReports.responseHash',
      reason: 'aiReports.reason',
      details: 'aiReports.details',
    },
  },
}));

import aiReportRoute, { AI_REPORT_PROBE as routeProbe } from '../../api/ai/report/route';

function reportRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AI_REPORT_PATH}`, { ...init, headers });
}

describe('aiReport helpers', () => {
  it('parseReportBody requires reason', () => {
    expect(parseReportBody({ reason: 'hallucination', details: ' wrong ' })).toEqual({
      ok: true,
      reason: 'hallucination',
      details: 'wrong',
      messageId: '',
      query: '',
      response: '',
    });
    expect(parseReportBody({ details: 'x' })).toEqual({ ok: false, error: AI_REPORT_PROBE.missingReasonError });
  });

  it('exports stable e2e probe contract', () => {
    expect(AI_REPORT_PROBE.path).toBe('/api/ai/report');
    expect(routeProbe.rateLimitKey).toBe('cet-ai-report');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/ai/report e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AI_REPORT_PATH);
    expect(src).toContain('api/ai/report/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await aiReportRoute(reportRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST rejects missing reason', async () => {
    const res = await aiReportRoute(
      reportRequest({ method: 'POST', body: JSON.stringify({ details: 'bad answer' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AI_REPORT_PROBE.missingReasonError);
  });

  it('POST creates report without auth', async () => {
    const res = await aiReportRoute(
      reportRequest({ method: 'POST', body: JSON.stringify({ reason: 'unsafe' }) }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { reportId: string };
    expect(body.reportId).toBe('rep-1');
  });

  it('GET returns 405', async () => {
    const res = await aiReportRoute(reportRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});