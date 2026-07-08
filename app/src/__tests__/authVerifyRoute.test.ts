// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_VERIFY_PATH, AUTH_VERIFY_PROBE, parseAuthVerifyPostBody } from '../../api/lib/authVerify';

const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

const verifyMocks = vi.hoisted(() => ({
  existingUser: null as { id: string; walletAddress: string } | null,
  challengeOk: true,
  tonProofOk: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: (origin: string | null) =>
    origin === 'https://evil.test' ? 'https://allowed.test' : (origin ?? 'https://allowed.test'),
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/authChallenges', () => ({
  consumeAuthChallenge: () => verifyMocks.challengeOk,
}));

vi.mock('../../api/lib/tonProof', () => ({
  extractTonProof: (raw: unknown) => (raw ? { payload: 'challenge-payload', signature: 'sig', timestamp: Date.now() } : null),
  verifyTonProof: () => (verifyMocks.tonProofOk ? { ok: true as const } : { ok: false as const, reason: 'bad_sig' }),
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  signJwt: async () => 'signed-jwt',
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  findReferrerByCode: async () => null,
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              const isUsers = table && typeof table === 'object' && 'walletAddress' in table;
              if (isUsers) {
                return {
                  limit: async () => (verifyMocks.existingUser ? [verifyMocks.existingUser] : []),
                  then(onFulfilled: (rows: unknown[]) => void, onRejected?: (err: unknown) => void) {
                    return Promise.resolve(verifyMocks.existingUser ? [verifyMocks.existingUser] : []).then(onFulfilled, onRejected);
                  },
                };
              }
              return {
                limit: async () => [],
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: 'user-new', walletAddress: VALID_WALLET }],
            onConflictDoNothing: async () => undefined,
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
    users: { walletAddress: 'users.walletAddress', id: 'users.id' },
    userTonWallets: { userId: 'userTonWallets.userId', address: 'userTonWallets.address' },
    sessions: { id: 'sessions.id' },
    referrals: {},
    userInvites: { id: 'userInvites.id', tokenHash: 'userInvites.tokenHash' },
    userInviteUses: {},
  },
}));

import authVerifyRoute, { AUTH_VERIFY_PROBE as routeProbe } from '../../api/auth/verify/route';

function verifyRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AUTH_VERIFY_PATH}`, { ...init, headers });
}

describe('authVerify helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AUTH_VERIFY_PROBE.path).toBe('/api/auth/verify');
    expect(routeProbe.rateLimitKey).toBe('auth-verify');
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });

  it('parseAuthVerifyPostBody extracts wallet and extras', () => {
    expect(
      parseAuthVerifyPostBody({
        walletAddress: VALID_WALLET,
        tonProof: { payload: 'x' },
        referralCode: 'ref1',
        inviteToken: 'tok',
      }),
    ).toEqual({
      walletRaw: VALID_WALLET,
      publicKey: null,
      tonProofRaw: { payload: 'x' },
      referralCode: 'REF1',
      inviteToken: 'tok',
    });
  });
});

describe('/api/auth/verify e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyMocks.existingUser = null;
    verifyMocks.challengeOk = true;
    verifyMocks.tonProofOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AUTH_VERIFY_PATH);
    expect(src).toContain('api/auth/verify/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await authVerifyRoute(verifyRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('GET returns 405', async () => {
    const res = await authVerifyRoute(verifyRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('POST with invalid wallet returns 400', async () => {
    const res = await authVerifyRoute(
      verifyRequest({
        method: 'POST',
        body: JSON.stringify({ walletAddress: 'bad', tonProof: { payload: 'x' } }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AUTH_VERIFY_PROBE.invalidWalletError);
  });

  it('POST without tonProof returns 400', async () => {
    const res = await authVerifyRoute(
      verifyRequest({
        method: 'POST',
        body: JSON.stringify({ walletAddress: VALID_WALLET }),
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AUTH_VERIFY_PROBE.missingTonProofError);
  });

  it('POST with expired challenge returns 401', async () => {
    verifyMocks.challengeOk = false;
    const res = await authVerifyRoute(
      verifyRequest({
        method: 'POST',
        body: JSON.stringify({ walletAddress: VALID_WALLET, tonProof: { payload: 'x' } }),
      }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(AUTH_VERIFY_PROBE.challengeExpiredError);
  });

  it('POST with valid proof returns token', async () => {
    const res = await authVerifyRoute(
      verifyRequest({
        method: 'POST',
        body: JSON.stringify({ walletAddress: VALID_WALLET, tonProof: { payload: 'x' } }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; wallet: string; token: string };
    expect(body.ok).toBe(true);
    expect(body.wallet).toBe(VALID_WALLET);
    expect(body.token).toBe('signed-jwt');
  });
});