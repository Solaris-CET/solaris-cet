// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  API_AUTH_PATH,
  API_AUTH_PROBE,
  normalizeReferralCode,
  parseWalletAuthPostBody,
} from '../../api/lib/apiAuth';

const authMocks = vi.hoisted(() => ({
  existingUser: {
    id: 'user-1',
    walletAddress: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
    referralCode: 'REFCODE1',
    points: 0,
    role: 'visitor',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
}));

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  verifyJwtWithSecrets: (token: string) =>
    token === 'valid-token' ? { wallet: VALID_WALLET, sid: 'sess-1' } : null,
  signJwt: async () => 'signed-jwt',
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where: async () => {
              if (table && typeof table === 'object' && 'walletAddress' in table) {
                return [authMocks.existingUser];
              }
              return [
                {
                  id: 'sess-1',
                  revokedAt: null,
                  expiresAt: new Date(Date.now() + 60_000),
                },
              ];
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: 'sess-1' }],
          };
        },
      };
    },
    update() {
      return {
        set() {
          return {
            where: async () => undefined,
          };
        },
      };
    },
  }),
  schema: {
    users: { walletAddress: 'users.walletAddress' },
    sessions: { id: 'sessions.id' },
  },
}));

import apiAuthRoute, { API_AUTH_PROBE as routeProbe } from '../../api/auth/route';

function authRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${API_AUTH_PATH}`, { ...init, headers });
}

describe('apiAuth helpers', () => {
  it('normalizeReferralCode validates pattern', () => {
    expect(normalizeReferralCode(' ab-cd_12 ')).toBe('AB-CD_12');
    expect(normalizeReferralCode('x')).toBeNull();
  });

  it('parseWalletAuthPostBody extracts wallet and extras', () => {
    expect(parseWalletAuthPostBody({ walletAddress: VALID_WALLET, referralCode: 'ref1' })).toEqual({
      ok: true,
      walletRaw: VALID_WALLET,
      referralCode: 'REF1',
      inviteToken: '',
    });
    expect(parseWalletAuthPostBody({})).toEqual({ ok: false, error: API_AUTH_PROBE.invalidWalletError });
  });

  it('exports stable e2e probe contract', () => {
    expect(API_AUTH_PROBE.path).toBe('/api/auth');
    expect(routeProbe.jwtTtlSeconds).toBe(3600);
    expect(routeProbe.methods).toEqual(['GET', 'POST', 'DELETE', 'OPTIONS']);
  });
});

describe('/api/auth e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(API_AUTH_PATH);
    expect(src).toContain('api/auth/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await apiAuthRoute(authRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });

  it('GET requires bearer token', async () => {
    const res = await apiAuthRoute(authRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns wallet for valid token', async () => {
    const res = await apiAuthRoute(
      authRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { wallet: string } };
    expect(body.user.wallet).toBe(VALID_WALLET);
  });

  it('POST rejects invalid wallet', async () => {
    const res = await apiAuthRoute(
      authRequest({ method: 'POST', body: JSON.stringify({ walletAddress: 'bad' }) }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(API_AUTH_PROBE.invalidWalletError);
  });

  it('POST syncs existing wallet user', async () => {
    const res = await apiAuthRoute(
      authRequest({ method: 'POST', body: JSON.stringify({ walletAddress: VALID_WALLET }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; token?: string };
    expect(body.id).toBe('user-1');
    expect(body.token).toBe('signed-jwt');
  });
});