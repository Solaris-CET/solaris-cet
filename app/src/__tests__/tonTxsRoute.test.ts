// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { mapTonTxEvent, parseTonTxsLimit, TON_TXS_PATH, TON_TXS_PROBE } from '../../api/lib/tonTxs';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/tonTxs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonTxs')>();
  return {
    ...actual,
    fetchTonTxEvents: vi.fn(async (address: string) => ({
      ok: true as const,
      address,
      network: 'mainnet' as const,
      items: [{ hash: 'tx1', now: '1710000000', type: 'transfer', lt: '100' }],
      nextCursor: '100',
    })),
  };
});

import tonTxsRoute, { TON_TXS_PROBE as routeProbe } from '../../api/ton/txs/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

describe('tonTxs helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_TXS_PROBE.path).toBe('/api/ton/txs');
    expect(routeProbe.defaultLimit).toBe(20);
  });

  it('mapTonTxEvent infers transfer type', () => {
    const item = mapTonTxEvent({ event_id: 'tx1', actions: [{ type: 'JettonTransfer' }] });
    expect(item?.type).toBe('transfer');
    expect(parseTonTxsLimit('')).toBe(20);
  });
});

describe('/api/ton/txs e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_TXS_PATH);
    expect(src).toContain('api/ton/txs/route.js');
  });

  it('GET returns transaction events', async () => {
    const res = await tonTxsRoute(
      new Request(`http://test${TON_TXS_PATH}?address=${wallet}`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: Array<{ hash: string }> };
    expect(body.ok).toBe(true);
    expect(body.items[0]?.hash).toBe('tx1');
  });
});