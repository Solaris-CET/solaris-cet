// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_LEADS_PATH,
  ADMIN_LEADS_PROBE,
  parseLeadsLimit,
  parseLeadsPage,
  shouldReturnEmptyLeads,
} from '../../api/lib/adminLeads';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
  leads: [
    {
      id: 'lead-1',
      name: 'Ion Popescu',
      phone: '+40700000000',
      email: 'ion@test.com',
      location: 'București',
      serviceType: 'fotovoltaice',
      message: 'Doresc ofertă',
      createdAt: new Date('2024-06-01T10:00:00.000Z'),
    },
  ],
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
vi.mock('../../db/schema', () => ({
  quotes: {
    id: 'quotes.id',
    name: 'quotes.name',
    phone: 'quotes.phone',
    email: 'quotes.email',
    location: 'quotes.location',
    serviceType: 'quotes.serviceType',
    message: 'quotes.message',
    createdAt: 'quotes.createdAt',
  },
}));

import adminLeadsRoute, { ADMIN_LEADS_PROBE as routeProbe } from '../../api/admin/leads/route';

describe('adminLeads helpers', () => {
  it('parseLeadsPage and parseLeadsLimit apply defaults and bounds', () => {
    expect(parseLeadsPage(new URLSearchParams())).toBe(ADMIN_LEADS_PROBE.defaultPage);
    expect(parseLeadsPage(new URLSearchParams('page=3'))).toBe(3);
    expect(parseLeadsPage(new URLSearchParams('page=0'))).toBe(ADMIN_LEADS_PROBE.defaultPage);
    // Number(null) === 0, which clamps to minLimit when param is absent
    expect(parseLeadsLimit(new URLSearchParams())).toBe(ADMIN_LEADS_PROBE.minLimit);
    expect(parseLeadsLimit(new URLSearchParams('limit=50'))).toBe(50);
    expect(parseLeadsLimit(new URLSearchParams('limit=500'))).toBe(ADMIN_LEADS_PROBE.maxLimit);
  });

  it('shouldReturnEmptyLeads skips query when status filter is not default', () => {
    expect(shouldReturnEmptyLeads('')).toBe(false);
    expect(shouldReturnEmptyLeads('nou')).toBe(false);
    expect(shouldReturnEmptyLeads('contactat')).toBe(true);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_LEADS_PROBE.path).toBe('/api/admin/leads');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.defaultLeadStatus).toBe('nou');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/leads e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.leads = [
      {
        id: 'lead-1',
        name: 'Ion Popescu',
        phone: '+40700000000',
        email: 'ion@test.com',
        location: 'București',
        serviceType: 'fotovoltaice',
        message: 'Doresc ofertă',
        createdAt: new Date('2024-06-01T10:00:00.000Z'),
      },
    ];
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_LEADS_PATH);
    expect(src).toContain('api/admin/leads/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminLeadsRoute(
      new Request(`http://test${ADMIN_LEADS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects unknown origins', async () => {
    const res = await adminLeadsRoute(
      new Request(`http://test${ADMIN_LEADS_PATH}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer admin-token', origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminLeadsRoute(adminRequest(ADMIN_LEADS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_LEADS_PROBE.unauthenticatedStatus);
  });

  it('GET returns leads from quotes', async () => {
    const res = await adminLeadsRoute(adminRequest(ADMIN_LEADS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      leads: Array<{ id: string; name: string; status: string; source: string }>;
      total: number;
      page: number;
      limit: number;
    };
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0]?.id).toBe('lead-1');
    expect(body.leads[0]?.name).toBe('Ion Popescu');
    expect(body.leads[0]?.status).toBe('nou');
    expect(body.leads[0]?.source).toBe('quote');
    expect(body.total).toBe(1);
    expect(body.page).toBe(ADMIN_LEADS_PROBE.defaultPage);
    expect(body.limit).toBe(ADMIN_LEADS_PROBE.minLimit);
  });

  it('GET returns empty list when status filter is not nou', async () => {
    const res = await adminLeadsRoute(
      adminRequest(`${ADMIN_LEADS_PATH}?status=contactat`, { method: 'GET' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { leads: unknown[]; total: number; totalPages: number };
    expect(body.leads).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.totalPages).toBe(0);
  });

  it('POST returns 405', async () => {
    const res = await adminLeadsRoute(adminRequest(ADMIN_LEADS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});