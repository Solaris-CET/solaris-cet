// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUDIT_PATH, AUDIT_PROBE, parseAuditBody, walletFromJwtDecoded } from '../../api/lib/audit';

const auditMocks = vi.hoisted(() => ({
  dbOk: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  verifyJwtWithSecrets: (token: string) => (token === 'valid-wallet-token' ? { wallet: 'EQwallet123456' } : null),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values: async () => {
          if (!auditMocks.dbOk) throw new Error('db down');
        },
      };
    },
  }),
  schema: {
    auditLogs: {
      walletAddress: 'auditLogs.walletAddress',
      action: 'auditLogs.action',
      details: 'auditLogs.details',
    },
  },
}));

import auditRoute, { AUDIT_PROBE as routeProbe } from '../../api/audit/route';

function auditRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AUDIT_PATH}`, { ...init, headers });
}

describe('audit helpers', () => {
  it('parseAuditBody extracts action and details', () => {
    expect(parseAuditBody({ action: 'login', details: { ip: '1.2.3.4' } })).toEqual({
      action: 'login',
      details: JSON.stringify({ ip: '1.2.3.4' }),
      walletAddress: null,
    });
    expect(parseAuditBody(null).action).toBe(AUDIT_PROBE.defaultAction);
  });

  it('walletFromJwtDecoded reads wallet claim', () => {
    expect(walletFromJwtDecoded({ wallet: 'EQabc' })).toBe('EQabc');
    expect(walletFromJwtDecoded(null)).toBeNull();
  });

  it('exports stable e2e probe contract', () => {
    expect(AUDIT_PROBE.path).toBe('/api/audit');
    expect(routeProbe.dbSuccessStatus).toBe(201);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });
});

describe('/api/audit e2e probe', () => {
  beforeEach(() => {
    auditMocks.dbOk = true;
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AUDIT_PATH);
    expect(src).toContain('api/audit/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await auditRoute(auditRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('POST persists audit to db', async () => {
    const res = await auditRoute(
      auditRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-wallet-token' },
        body: JSON.stringify({ action: 'wallet_connect' }),
      }),
    );
    expect(res.status).toBe(AUDIT_PROBE.dbSuccessStatus);
    const body = (await res.json()) as { success: boolean; mode: string };
    expect(body.success).toBe(true);
    expect(body.mode).toBe('db');
  });

  it('POST falls back to stdout when db unavailable', async () => {
    auditMocks.dbOk = false;
    const res = await auditRoute(
      auditRequest({ method: 'POST', body: JSON.stringify({ action: 'fallback_test' }) }),
    );
    expect(res.status).toBe(AUDIT_PROBE.fallbackStatus);
    const body = (await res.json()) as { success: boolean; mode: string };
    expect(body.mode).toBe('stdout');
  });

  it('GET returns 405', async () => {
    const res = await auditRoute(auditRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });
});