// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ADMIN_ME_PATH, ADMIN_ME_PROBE } from '../../api/lib/adminMe';

const adminMocks = vi.hoisted(() => ({
  authOk: true,
}));

vi.mock('../../api/lib/adminAuth', () => ({
  requireAdminAuth: async () => {
    if (!adminMocks.authOk) return { status: 401, error: 'Unauthorized' };
    return {
      admin: { id: 'admin_1', email: 'admin@test.com', role: 'admin' },
      sessionId: 'sess_1',
    };
  },
}));

import adminMeRoute, { ADMIN_ME_PROBE as routeProbe } from '../../api/admin/me/route';

describe('adminMe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(ADMIN_ME_PROBE.path).toBe('/api/admin/me');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });
});

describe('/api/admin/me e2e probe', () => {
  beforeEach(() => {
    adminMocks.authOk = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_ME_PATH);
    expect(src).toContain('api/admin/me/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminMeRoute(
      new Request(`http://test${ADMIN_ME_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('GET requires admin auth', async () => {
    adminMocks.authOk = false;
    const res = await adminMeRoute(adminRequest(ADMIN_ME_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_ME_PROBE.unauthenticatedStatus);
  });

  it('GET returns admin profile', async () => {
    const res = await adminMeRoute(adminRequest(ADMIN_ME_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { admin: { id: string; email: string; role: string } };
    expect(body.admin.id).toBe('admin_1');
    expect(body.admin.email).toBe('admin@test.com');
    expect(body.admin.role).toBe('admin');
  });

  it('POST returns 405', async () => {
    const res = await adminMeRoute(adminRequest(ADMIN_ME_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});