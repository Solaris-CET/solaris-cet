// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildWalletsLinkSuccessBody,
  buildWalletsLinkTelegramMessage,
  parseWalletsLinkBody,
  WALLETS_LINK_PATH,
  WALLETS_LINK_PROBE,
} from '../../api/lib/walletsLink';

const linkMocks = vi.hoisted(() => ({
  authOk: true,
  challengeOk: true,
  proofOk: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    if (!linkMocks.authOk) return { error: 'Unauthorized', status: 401 };
    if (!req.headers.get('Authorization')?.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 };
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/authChallenges', () => ({
  consumeAuthChallenge: () => linkMocks.challengeOk,
}));

vi.mock('../../api/lib/tonProof', () => ({
  extractTonProof: () => ({ payload: 'challenge-1', signature: 'sig', timestamp: 1, domain: { lengthBytes: 0, value: 'allowed.test' } }),
  verifyTonProof: () => (linkMocks.proofOk ? { ok: true as const } : { ok: false as const, reason: 'bad-sig' }),
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  signJwt: async () => 'jwt-token',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            onConflictDoUpdate: () => undefined,
            returning: async () => [{ id: 'sess-new' }],
          };
        },
      };
    },
    update() {
      return { set: () => ({ where: async () => undefined }) };
    },
  }),
  schema: {
    userTonWallets: { userId: 'userTonWallets.userId', address: 'userTonWallets.address' },
    users: { id: 'users.id', walletAddress: 'users.walletAddress' },
    sessions: { id: 'sessions.id' },
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
  },
}));

import walletsLinkRoute, { WALLETS_LINK_PROBE as routeProbe } from '../../api/wallets/link/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

function linkRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${WALLETS_LINK_PATH}`, { method: 'POST', ...init, headers, body: JSON.stringify(body) });
}

describe('walletsLink helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WALLETS_LINK_PROBE.path).toBe('/api/wallets/link');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseWalletsLinkBody extracts wallet fields', () => {
    const parsed = parseWalletsLinkBody({ walletAddress: wallet, label: 'Main', setPrimary: true });
    expect(parsed.walletRaw).toBe(wallet);
    expect(parsed.setPrimary).toBe(true);
    expect(buildWalletsLinkSuccessBody(wallet, 'jwt').token).toBe('jwt');
    expect(buildWalletsLinkTelegramMessage(wallet)).toContain('Wallet adăugat');
  });
});

describe('/api/wallets/link e2e probe', () => {
  beforeEach(() => {
    linkMocks.authOk = true;
    linkMocks.challengeOk = true;
    linkMocks.proofOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WALLETS_LINK_PATH);
    expect(src).toContain('api/wallets/link/route.js');
  });

  it('POST without auth returns 401', async () => {
    linkMocks.authOk = false;
    const res = await walletsLinkRoute(linkRequest({ walletAddress: wallet, tonProof: {} }));
    expect(res.status).toBe(401);
  });

  it('POST links wallet with valid proof', async () => {
    const res = await walletsLinkRoute(
      linkRequest({ walletAddress: wallet, tonProof: { payload: 'challenge-1' }, publicKey: 'pk' }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; wallet: string; token: string };
    expect(body.ok).toBe(true);
    expect(body.wallet).toBe(wallet);
    expect(body.token).toBe('jwt-token');
  });
});