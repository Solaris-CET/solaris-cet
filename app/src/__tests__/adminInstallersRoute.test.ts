// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_INSTALLERS_PATH,
  ADMIN_INSTALLERS_PROBE,
  installersUpstreamUrl,
} from '../../api/lib/adminInstallers';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'viewer' as 'admin' | 'editor' | 'viewer',
  fetchOk: true,
  fetchData: { installers: [] } as Record<string, unknown>,
  fetchThrows: false,
}));

const fetchMock = vi.hoisted(() => vi.fn());

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

import adminInstallersRoute, { ADMIN_INSTALLERS_PROBE as routeProbe } from '../../api/admin/installers/route';

describe('adminInstallers helpers', () => {
  it('installersUpstreamUrl points at survey-engine installers endpoint', () => {
    expect(installersUpstreamUrl()).toMatch(/\/installers$/);
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_INSTALLERS_PROBE.path).toBe('/api/admin/installers');
    expect(routeProbe.minRole).toBe('viewer');
    expect(routeProbe.platform).toBe('solaris-cet');
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/installers e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    adminMocks.role = 'viewer';
    adminMocks.fetchOk = true;
    adminMocks.fetchThrows = false;
    adminMocks.fetchData = { installers: [{ id: 'inst-1', name: 'Solar Pro' }] };
    fetchMock.mockImplementation(async () => {
      if (adminMocks.fetchThrows) throw new Error('network down');
      return {
        ok: adminMocks.fetchOk,
        json: async () => adminMocks.fetchData,
      };
    });
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_INSTALLERS_PATH);
    expect(src).toContain('api/admin/installers/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminInstallersRoute(
      new Request(`http://test${ADMIN_INSTALLERS_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects unknown origins', async () => {
    const res = await adminInstallersRoute(
      new Request(`http://test${ADMIN_INSTALLERS_PATH}`, {
        method: 'GET',
        headers: { origin: 'https://evil.test' },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminInstallersRoute(adminRequest(ADMIN_INSTALLERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_INSTALLERS_PROBE.unauthenticatedStatus);
  });

  it('GET proxies installers from survey-engine', async () => {
    const res = await adminInstallersRoute(adminRequest(ADMIN_INSTALLERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { platform: string; installers: Array<{ id: string }> };
    expect(body.platform).toBe('solaris-cet');
    expect(body.installers[0]?.id).toBe('inst-1');
    expect(fetchMock).toHaveBeenCalledWith(
      installersUpstreamUrl(),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('GET returns 503 when survey-engine is unreachable', async () => {
    adminMocks.fetchThrows = true;
    const res = await adminInstallersRoute(adminRequest(ADMIN_INSTALLERS_PATH, { method: 'GET' }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('survey-engine unreachable');
  });

  it('POST returns 405', async () => {
    const res = await adminInstallersRoute(adminRequest(ADMIN_INSTALLERS_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});