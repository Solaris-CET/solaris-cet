// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_SURVEYS_AUTH_GUARD,
  ADMIN_SURVEYS_OPENAPI,
  ADMIN_SURVEYS_PATH,
  ADMIN_SURVEYS_PROBE,
  buildAdminSurveysError,
  parseAdminSurveysInstallerFilter,
  parseAdminSurveysLimit,
  parseAdminSurveysQuery,
  parseSurveyLeadLine,
} from '../../api/lib/adminSurveys';
import { buildSurveyOpenApiPaths, hasOpenApiOperation } from '../../api/lib/surveyOpenApi';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
  ledgerContent: JSON.stringify({
    receivedAt: '2026-01-01T00:00:00.000Z',
    reportId: 'rep-1',
    name: 'Ion Popescu',
    telefon: '+40700000000',
    judet: 'București',
    installerId: 'inst-1',
    installerName: 'Solar Pro',
    score: 85,
  }),
}));

const fetchMock = vi.hoisted(() => vi.fn());
const rateLimitMocks = vi.hoisted(() => ({ limited: false }));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => (rateLimitMocks.limited ? new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 }) : null),
}));
const readFileMock = vi.hoisted(() => vi.fn());

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: readFileMock,
    },
  };
});

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

import adminSurveysRoute, { ADMIN_SURVEYS_PROBE as routeProbe } from '../../api/admin/surveys/route';

describe('adminSurveys helpers', () => {
  it('parseAdminSurveysQuery validates limit and installer_id via zod', () => {
    expect(parseAdminSurveysQuery(new URLSearchParams())).toEqual({ limit: 30, installerId: '' });
    expect(parseAdminSurveysQuery(new URLSearchParams('limit=50&installer_id= inst-9 '))).toEqual({
      limit: 50,
      installerId: 'inst-9',
    });
    expect(parseAdminSurveysQuery(new URLSearchParams('limit=0'))).toEqual({ limit: 1, installerId: '' });
  });

  it('buildAdminSurveysError returns stable error shape', () => {
    expect(buildAdminSurveysError('oops')).toEqual({ error: 'oops' });
  });

  it('parseAdminSurveysLimit applies defaults and bounds', () => {
    expect(parseAdminSurveysLimit(new URLSearchParams())).toBe(ADMIN_SURVEYS_PROBE.defaultLimit);
    expect(parseAdminSurveysLimit(new URLSearchParams('limit=50'))).toBe(50);
    expect(parseAdminSurveysLimit(new URLSearchParams('limit=500'))).toBe(ADMIN_SURVEYS_PROBE.maxLimit);
    expect(parseAdminSurveysLimit(new URLSearchParams('limit=0'))).toBe(ADMIN_SURVEYS_PROBE.minLimit);
  });

  it('parseSurveyLeadLine parses valid JSON and rejects malformed lines', () => {
    const lead = parseSurveyLeadLine(adminMocks.ledgerContent);
    expect(lead?.reportId).toBe('rep-1');
    expect(lead?.installerId).toBe('inst-1');
    expect(parseSurveyLeadLine('not-json')).toBeNull();
  });

  it('parseAdminSurveysInstallerFilter trims installer_id', () => {
    expect(parseAdminSurveysInstallerFilter(new URLSearchParams('installer_id= inst-9 '))).toBe('inst-9');
    expect(parseAdminSurveysInstallerFilter(new URLSearchParams())).toBe('');
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_SURVEYS_PROBE.path).toBe('/api/admin/surveys');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
    expect(routeProbe.rateLimitKey).toBe('admin-surveys');
    expect(routeProbe.rateLimit).toBe(60);
    expect(routeProbe.authRequired).toBe(true);
    expect(ADMIN_SURVEYS_AUTH_GUARD.minRole).toBe('viewer');
    expect(routeProbe.observabilityLabel).toBe('admin.surveys');
  });

  it('is documented in survey OpenAPI spec', () => {
    const paths = buildSurveyOpenApiPaths();
    expect(hasOpenApiOperation(paths, ADMIN_SURVEYS_OPENAPI.path, 'get')).toBe(true);
    expect(ADMIN_SURVEYS_OPENAPI.summary).toContain('leads');
  });
});

describe('/api/admin/surveys e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    rateLimitMocks.limited = false;
    readFileMock.mockResolvedValue(`${adminMocks.ledgerContent}\n`);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ total_reports: 12 }),
    });
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_SURVEYS_PATH);
    expect(src).toContain('api/admin/surveys/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminSurveysRoute(
      new Request(`http://test${ADMIN_SURVEYS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET returns 429 when rate limited', async () => {
    rateLimitMocks.limited = true;
    const res = await adminSurveysRoute(adminRequest(`${ADMIN_SURVEYS_PATH}?limit=10`, { method: 'GET' }));
    expect(res.status).toBe(429);
  });

  it('GET rejects disallowed origin', async () => {
    const res = await adminSurveysRoute(
      new Request(`http://test${ADMIN_SURVEYS_PATH}?limit=10`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
          origin: 'https://evil.test',
        },
      }),
    );
    expect(res.status).toBe(ADMIN_SURVEYS_PROBE.forbiddenStatus);
    expect(await res.json()).toEqual({ error: ADMIN_SURVEYS_PROBE.forbiddenError });
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminSurveysRoute(adminRequest(ADMIN_SURVEYS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_SURVEYS_PROBE.unauthenticatedStatus);
    expect(await res.json()).toEqual({ error: ADMIN_SURVEYS_PROBE.unauthorizedError });
  });

  it('GET returns crm leads and engine dashboard', async () => {
    const res = await adminSurveysRoute(adminRequest(`${ADMIN_SURVEYS_PATH}?limit=10`, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      crm_leads: Array<{ reportId: string; installerId?: string }>;
      total: number;
      installers: string[];
      engine: { total_reports: number } | null;
    };
    expect(body.crm_leads[0]?.reportId).toBe('rep-1');
    expect(body.total).toBe(1);
    expect(body.installers).toEqual(['inst-1']);
    expect(body.engine).toEqual({ total_reports: 12 });
  });

  it('GET filters by installer_id', async () => {
    const res = await adminSurveysRoute(
      adminRequest(`${ADMIN_SURVEYS_PATH}?installer_id=missing`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { crm_leads: unknown[]; total: number };
    expect(body.crm_leads).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('POST returns 405', async () => {
    const res = await adminSurveysRoute(adminRequest(ADMIN_SURVEYS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});