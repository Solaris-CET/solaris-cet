// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_SURVEY_INSIGHTS_AUTH_GUARD,
  ADMIN_SURVEY_INSIGHTS_OPENAPI,
  ADMIN_SURVEY_INSIGHTS_PATH,
  ADMIN_SURVEY_INSIGHTS_PROBE,
  buildAdminSurveyInsightsError,
  buildSurveyInsightFlags,
  parseAdminSurveyInsightsQuery,
  parseSurveyInsightsReportId,
} from '../../api/lib/adminSurveyInsights';
import { buildSurveyOpenApiPaths,hasOpenApiOperation } from '../../api/lib/surveyOpenApi';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
}));

const fetchMock = vi.hoisted(() => vi.fn());
const rateLimitMocks = vi.hoisted(() => ({ limited: false }));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => (rateLimitMocks.limited ? new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }) : null),
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!adminMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[adminMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: adminMocks.role }, sessionId: 'sess_1' };
  },
}));
vi.stubGlobal('fetch', fetchMock);

import adminSurveyInsightsRoute, { ADMIN_SURVEY_INSIGHTS_PROBE as routeProbe } from '../../api/admin/survey-insights/route';

function mockSurveyFetch() {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/context/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          explainable: { low_confidence_count: 2 },
          files: { permit_pack_url: 'https://perm.it/pack' },
          crm: { context_url: 'https://crm.it/ctx' },
        }),
      });
    }
    if (url.includes('/twin-feed/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ low_confidence_count: 1 }),
      });
    }
    if (url.includes('/corrections')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ corrections: [{ id: 'corr-1', field: 'roof_area' }] }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  });
}

describe('adminSurveyInsights helpers', () => {
  it('parseAdminSurveyInsightsQuery validates report_id with zod', () => {
    expect(parseAdminSurveyInsightsQuery(new URLSearchParams('report_id=rep-42'))).toEqual({
      ok: true,
      reportId: 'rep-42',
    });
    expect(parseAdminSurveyInsightsQuery(new URLSearchParams('report_id=  rep-99  '))).toEqual({
      ok: true,
      reportId: 'rep-99',
    });
    expect(parseAdminSurveyInsightsQuery(new URLSearchParams())).toEqual({
      ok: false,
      error: ADMIN_SURVEY_INSIGHTS_PROBE.missingReportIdError,
    });
    expect(parseAdminSurveyInsightsQuery(new URLSearchParams(`report_id=${'x'.repeat(81)}`))).toEqual({
      ok: false,
      error: ADMIN_SURVEY_INSIGHTS_PROBE.missingReportIdError,
    });
  });

  it('parseSurveyInsightsReportId reads report_id query param', () => {
    expect(parseSurveyInsightsReportId(new URLSearchParams('report_id=rep-42'))).toBe('rep-42');
    expect(parseSurveyInsightsReportId(new URLSearchParams('report_id=  rep-99  '))).toBe('rep-99');
    expect(parseSurveyInsightsReportId(new URLSearchParams())).toBe('');
  });

  it('buildAdminSurveyInsightsError returns stable error shape', () => {
    expect(buildAdminSurveyInsightsError('oops')).toEqual({ error: 'oops' });
  });

  it('buildSurveyInsightFlags merges context and twin signals', () => {
    expect(
      buildSurveyInsightFlags(
        {
          explainable: { low_confidence_count: 2 },
          files: { permit_pack_url: 'https://perm.it/pack' },
          crm: { context_url: 'https://crm.it/ctx' },
        },
        { low_confidence_count: 1 },
      ),
    ).toEqual({
      low_confidence: true,
      low_confidence_count: 2,
      permit_pack_url: 'https://perm.it/pack',
      context_url: 'https://crm.it/ctx',
    });
    expect(buildSurveyInsightFlags({}, null)).toEqual({
      low_confidence: false,
      low_confidence_count: 0,
      permit_pack_url: undefined,
      context_url: undefined,
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_SURVEY_INSIGHTS_PROBE.path).toBe('/api/admin/survey-insights');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.missingReportIdError).toBe('report_id required');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
    expect(routeProbe.rateLimitKey).toBe('admin-survey-insights');
    expect(routeProbe.rateLimit).toBe(30);
    expect(routeProbe.authRequired).toBe(true);
    expect(ADMIN_SURVEY_INSIGHTS_AUTH_GUARD.minRole).toBe('viewer');
    expect(routeProbe.observabilityLabel).toBe('admin.survey_insights');
  });

  it('is documented in survey OpenAPI spec', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, ADMIN_SURVEY_INSIGHTS_OPENAPI.path, 'get')).toBe(true);
    expect(ADMIN_SURVEY_INSIGHTS_OPENAPI.summary).toContain('insights');
  });
});

describe('/api/admin/survey-insights e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    rateLimitMocks.limited = false;
    fetchMock.mockReset();
    mockSurveyFetch();
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_SURVEY_INSIGHTS_PATH);
    expect(src).toContain('api/admin/survey-insights/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminSurveyInsightsRoute(
      new Request(`http://test${ADMIN_SURVEY_INSIGHTS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET returns 429 when rate limited', async () => {
    rateLimitMocks.limited = true;
    const res = await adminSurveyInsightsRoute(
      adminRequest(`${ADMIN_SURVEY_INSIGHTS_PATH}?report_id=rep-42`, { method: 'GET' }),
    );
    expect(res.status).toBe(429);
  });

  it('GET rejects disallowed origin', async () => {
    const res = await adminSurveyInsightsRoute(
      new Request(`http://test${ADMIN_SURVEY_INSIGHTS_PATH}?report_id=rep-42`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
          origin: 'https://evil.test',
        },
      }),
    );
    expect(res.status).toBe(ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenStatus);
    expect(await res.json()).toEqual({ error: ADMIN_SURVEY_INSIGHTS_PROBE.forbiddenError });
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminSurveyInsightsRoute(
      adminRequest(`${ADMIN_SURVEY_INSIGHTS_PATH}?report_id=rep-42`, { method: 'GET' }),
    );
    expect(res.status).toBe(ADMIN_SURVEY_INSIGHTS_PROBE.unauthenticatedStatus);
    expect(await res.json()).toEqual({ error: ADMIN_SURVEY_INSIGHTS_PROBE.unauthorizedError });
  });

  it('GET returns 400 when report_id is missing', async () => {
    const res = await adminSurveyInsightsRoute(adminRequest(ADMIN_SURVEY_INSIGHTS_PATH, { method: 'GET' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(ADMIN_SURVEY_INSIGHTS_PROBE.missingReportIdError);
  });

  it('GET with report_id returns insights payload', async () => {
    const res = await adminSurveyInsightsRoute(
      adminRequest(`${ADMIN_SURVEY_INSIGHTS_PATH}?report_id=rep-42`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      report_id: string;
      context: { explainable: { low_confidence_count: number } };
      twin_feed: { low_confidence_count: number };
      corrections: Array<{ id: string }>;
      flags: { low_confidence: boolean; low_confidence_count: number };
    };
    expect(body.report_id).toBe('rep-42');
    expect(body.context.explainable.low_confidence_count).toBe(2);
    expect(body.twin_feed.low_confidence_count).toBe(1);
    expect(body.corrections[0]?.id).toBe('corr-1');
    expect(body.flags.low_confidence).toBe(true);
    expect(body.flags.low_confidence_count).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/context/rep-42');
    expect(fetchMock.mock.calls[1]?.[0]).toContain('/twin-feed/rep-42');
    expect(fetchMock.mock.calls[2]?.[0]).toContain('/corrections?report_id=rep-42');
  });

  it('POST returns 405', async () => {
    const res = await adminSurveyInsightsRoute(
      adminRequest(`${ADMIN_SURVEY_INSIGHTS_PATH}?report_id=rep-42`, { method: 'POST' }),
    );
    expect(res.status).toBe(405);
  });
});