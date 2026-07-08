// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCetJettonMaster, TON_BALANCE_PATH, TON_BALANCE_PROBE } from '../../api/lib/tonBalance';
import { extractCetBalanceNanoFromTonapiJettons, extractTonBalanceNanoFromTonapiAccount } from '../../api/lib/tonBalanceShared';

const balanceMocks = vi.hoisted(() => ({
  result: {
    ok: true as const,
    address: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
    tonBalanceNano: '1000',
    cetBalanceNano: '500',
    cetJettonWalletAddress: null,
    source: 'tonapi' as const,
    network: 'mainnet' as const,
  },
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/tonBalanceShared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonBalanceShared')>();
  return {
    ...actual,
    fetchTonAccountBalances: vi.fn(async () => balanceMocks.result),
  };
});

import tonBalanceRoute, { TON_BALANCE_PROBE as routeProbe } from '../../api/ton/balance/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

function balanceRequest(params = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${TON_BALANCE_PATH}?address=${encodeURIComponent(wallet)}${params}`, { method: 'GET', ...init, headers });
}

describe('tonBalance helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_BALANCE_PROBE.path).toBe('/api/ton/balance');
    expect(routeProbe.includeJettonWallet).toBe(true);
  });

  it('resolveCetJettonMaster falls back to mainnet default', () => {
    expect(resolveCetJettonMaster({} as NodeJS.ProcessEnv)).toContain('EQ');
  });

  it('extracts balances from tonapi payloads', () => {
    expect(extractTonBalanceNanoFromTonapiAccount({ balance: '42' })).toBe('42');
    expect(
      extractCetBalanceNanoFromTonapiJettons(
        { balances: [{ jetton: { address: resolveCetJettonMaster({}) }, balance: '9' }] },
        resolveCetJettonMaster({}),
      ),
    ).toBe('9');
  });
});

describe('/api/ton/balance e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_BALANCE_PATH);
    expect(src).toContain('api/ton/balance/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await tonBalanceRoute(balanceRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns balance payload', async () => {
    const res = await tonBalanceRoute(balanceRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; address: string };
    expect(body.ok).toBe(true);
    expect(body.address).toBe(wallet);
  });
});