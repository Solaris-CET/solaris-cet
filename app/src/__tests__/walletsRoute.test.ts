// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildWalletsListResponse,
  mergeUserWallets,
  validateWalletsDelete,
  WALLETS_PATH,
  WALLETS_PROBE,
} from '../../api/lib/wallets';

const walletMocks = vi.hoisted(() => ({
  authOk: true,
  dbRows: [{ address: 'EQSecondaryWallet123456789012345678901234567', label: 'Alt', isPrimary: false }],
}));

const primaryWallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
const secondaryWallet = 'EQSecondaryWallet123456789012345678901234567';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    if (!walletMocks.authOk || !req.headers.get('Authorization')?.startsWith('Bearer ')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: primaryWallet, role: 'user' },
      sid: 'sess-1',
      mfaEnabled: false,
    };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => walletMocks.dbRows,
            limit: async () => [],
          };
        },
      };
    },
    delete() {
      return { where: async () => undefined };
    },
    update() {
      return { set: () => ({ where: async () => undefined }) };
    },
  }),
  schema: {
    userTonWallets: { userId: 'userTonWallets.userId', address: 'userTonWallets.address' },
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
  },
}));

import walletsRoute, { WALLETS_PROBE as routeProbe } from '../../api/wallets/route';

function walletsRequest(url = WALLETS_PATH, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${url}`, { ...init, headers });
}

describe('wallets helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WALLETS_PROBE.path).toBe('/api/wallets');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('mergeUserWallets includes primary when missing from table', () => {
    const wallets = mergeUserWallets(primaryWallet, []);
    expect(wallets).toEqual([{ address: primaryWallet, label: null, isPrimary: true }]);
    expect(buildWalletsListResponse(wallets).ok).toBe(true);
  });

  it('validateWalletsDelete blocks primary unlink', () => {
    expect(validateWalletsDelete('', primaryWallet).ok).toBe(false);
    expect(validateWalletsDelete(primaryWallet, primaryWallet)).toEqual({
      ok: false,
      status: 409,
      error: WALLETS_PROBE.cannotUnlinkPrimaryError,
    });
  });
});

describe('/api/wallets e2e probe', () => {
  beforeEach(() => {
    walletMocks.authOk = true;
    walletMocks.dbRows = [{ address: secondaryWallet, label: 'Alt', isPrimary: false }];
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WALLETS_PATH);
    expect(src).toContain('api/wallets/route.js');
  });

  it('GET lists merged wallets for authenticated user', async () => {
    const res = await walletsRoute(walletsRequest(WALLETS_PATH, { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; wallets: Array<{ address: string; isPrimary: boolean }> };
    expect(body.ok).toBe(true);
    expect(body.wallets.some((w) => w.address === primaryWallet && w.isPrimary)).toBe(true);
    expect(body.wallets.some((w) => w.address === secondaryWallet)).toBe(true);
  });

  it('DELETE without auth returns 401', async () => {
    walletMocks.authOk = false;
    const res = await walletsRoute(walletsRequest(`${WALLETS_PATH}?address=${secondaryWallet}`, { method: 'DELETE' }));
    expect(res.status).toBe(401);
  });
});