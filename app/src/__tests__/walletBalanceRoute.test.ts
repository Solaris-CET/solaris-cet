// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { WALLET_BALANCE_PATH, WALLET_BALANCE_PROBE } from '../../api/lib/walletBalance';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/tonBalanceShared', () => ({
  fetchTonAccountBalances: vi.fn(async (address: string) => ({
    ok: true,
    address,
    tonBalanceNano: '2000',
    cetBalanceNano: '100',
    source: 'tonapi',
    network: 'mainnet',
  })),
}));

import walletBalanceRoute, { WALLET_BALANCE_PROBE as routeProbe } from '../../api/wallet/balance/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

describe('walletBalance helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(WALLET_BALANCE_PROBE.path).toBe('/api/wallet/balance');
    expect(routeProbe.runtime).toBe('edge');
    expect(routeProbe.includeJettonWallet).toBe(false);
  });
});

describe('/api/wallet/balance e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(WALLET_BALANCE_PATH);
    expect(src).toContain('api/wallet/balance/route.js');
  });

  it('GET returns wallet balance payload', async () => {
    const res = await walletBalanceRoute(
      new Request(`http://test${WALLET_BALANCE_PATH}?address=${wallet}`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; address: string; tonBalanceNano: string };
    expect(body.ok).toBe(true);
    expect(body.address).toBe(wallet);
    expect(body.tonBalanceNano).toBe('2000');
  });
});