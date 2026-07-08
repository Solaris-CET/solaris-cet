// @vitest-environment node
import { adminRequest } from './helpers/request';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_TOKEN_PATH,
  ADMIN_TOKEN_PROBE,
  ADMIN_TOKEN_SYMBOL,
  asTokenDecimalString,
  parseTokenPutBody,
} from '../../api/lib/adminToken';

const tokenMocks = vi.hoisted(() => ({
  authOk: true,
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  row: {
    id: 'tok-1',
    symbol: 'CET',
    priceUsd: '1.25',
    totalSupply: '1000000',
    circulatingSupply: '500000',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedByAdminId: 'admin_1',
  },
  selectCall: 0,
  updateCalls: 0,
  insertCalls: 0,
}));

vi.mock('../../api/lib/adminAudit', () => ({
  writeAdminAudit: vi.fn(async () => undefined),
}));

vi.mock('../../api/lib/adminAuth', () => ({
  guardAdminRoute: async (req: Request, probe: {
    minRole: string | ((method: string) => string);
    unauthenticatedStatus?: number;
    unauthorizedError?: string;
    forbiddenStatus?: number;
    forbiddenError?: string;
  }) => {
    if (!tokenMocks.authOk) {
      return {
        status: probe.unauthenticatedStatus ?? 401,
        error: probe.unauthorizedError ?? 'Unauthorized',
      };
    }
    const minRole = typeof probe.minRole === 'function' ? probe.minRole(req.method) : probe.minRole;
    const ranks: Record<string, number> = { viewer: 1, editor: 2, admin: 3 };
    if ((ranks[tokenMocks.role] ?? 1) < (ranks[minRole] ?? 3)) {
      return {
        status: probe.forbiddenStatus ?? 403,
        error: probe.forbiddenError ?? 'Forbidden',
      };
    }
    return { admin: { id: 'admin_1', role: tokenMocks.role }, sessionId: 'sess_1' };
  },
}));
import adminTokenRoute, { ADMIN_TOKEN_PROBE as routeProbe } from '../../api/admin/token/route';
import { writeAdminAudit } from '../../api/lib/adminAudit';

describe('adminToken helpers', () => {
  it('asTokenDecimalString accepts finite numbers and decimal strings', () => {
    expect(asTokenDecimalString(1.5)).toBe('1.5');
    expect(asTokenDecimalString(' 12.34 ')).toBe('12.34');
    expect(asTokenDecimalString('bad')).toBeNull();
    expect(asTokenDecimalString('')).toBeNull();
  });

  it('parseTokenPutBody validates all token fields', () => {
    expect(
      parseTokenPutBody({ priceUsd: '1.2', totalSupply: '1000', circulatingSupply: '500' }),
    ).toEqual({
      ok: true,
      priceUsd: '1.2',
      totalSupply: '1000',
      circulatingSupply: '500',
    });
    expect(parseTokenPutBody({ priceUsd: 'x', totalSupply: '1', circulatingSupply: '1' })).toEqual({
      ok: false,
      error: 'Valori invalide',
    });
  });

  it('exports stable e2e probe contract', () => {
    expect(ADMIN_TOKEN_PROBE.path).toBe('/api/admin/token');
    expect(ADMIN_TOKEN_PROBE.symbol).toBe(ADMIN_TOKEN_SYMBOL);
    expect(routeProbe.getMinRole).toBe('viewer');
    expect(routeProbe.putMinRole).toBe('editor');
    expect(routeProbe.methods).toEqual(['GET', 'PUT', 'OPTIONS']);
  });
});

describe('/api/admin/token e2e probe', () => {
  beforeEach(() => {
    tokenMocks.authOk = true;
    tokenMocks.role = 'editor';
    tokenMocks.selectCall = 0;
    tokenMocks.updateCalls = 0;
    tokenMocks.insertCalls = 0;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(ADMIN_TOKEN_PATH);
    expect(src).toContain('api/admin/token/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await adminTokenRoute(
      new Request(`http://test${ADMIN_TOKEN_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });

  it('GET requires admin auth', async () => {
    tokenMocks.authOk = false;
    const res = await adminTokenRoute(adminRequest(ADMIN_TOKEN_PATH, { method: 'GET' }));
    expect(res.status).toBe(ADMIN_TOKEN_PROBE.unauthenticatedStatus);
  });

  it('GET returns token row', async () => {
    const res = await adminTokenRoute(adminRequest(ADMIN_TOKEN_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: { symbol: string; priceUsd: string } | null };
    expect(body.token?.symbol).toBe('CET');
    expect(body.token?.priceUsd).toBe('1.25');
  });

  it('PUT updates token and writes audit', async () => {
    const res = await adminTokenRoute(
      adminRequest(ADMIN_TOKEN_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceUsd: '2', totalSupply: '2000', circulatingSupply: '1500' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(tokenMocks.updateCalls).toBe(1);
    expect(writeAdminAudit).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ admin: expect.objectContaining({ id: 'admin_1' }) }),
      ADMIN_TOKEN_PROBE.auditAction,
      'cms_token_data',
      ADMIN_TOKEN_SYMBOL,
      expect.objectContaining({ priceUsd: '2' }),
    );
  });

  it('PUT rejects invalid body', async () => {
    const res = await adminTokenRoute(
      adminRequest(ADMIN_TOKEN_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceUsd: 'bad', totalSupply: '1', circulatingSupply: '1' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 405', async () => {
    const res = await adminTokenRoute(adminRequest(ADMIN_TOKEN_PATH, { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});