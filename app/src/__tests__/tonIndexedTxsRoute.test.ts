// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { clampTonIndexedTxsLimit, parseTonIndexedTxsLimit, TON_INDEXED_TXS_PATH, TON_INDEXED_TXS_PROBE } from '../../api/lib/tonIndexedTxs';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/tonIndexedTxs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonIndexedTxs')>();
  return {
    ...actual,
    listTonIndexedTransactions: vi.fn(async () => ({
      network: 'mainnet' as const,
      address: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
      items: [{ txHash: 'abc', kind: 'transfer', occurredAt: '2026-07-07T12:00:00.000Z' }],
    })),
  };
});

import tonIndexedTxsRoute, { TON_INDEXED_TXS_PROBE as routeProbe } from '../../api/ton/indexed-txs/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

describe('tonIndexedTxs helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_INDEXED_TXS_PROBE.path).toBe('/api/ton/indexed-txs');
    expect(routeProbe.rateLimit).toBe(120);
  });

  it('clamps indexed tx limits', () => {
    expect(parseTonIndexedTxsLimit('')).toBe(50);
    expect(clampTonIndexedTxsLimit(500)).toBe(100);
    expect(clampTonIndexedTxsLimit(10)).toBe(10);
  });
});

describe('/api/ton/indexed-txs e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_INDEXED_TXS_PATH);
    expect(src).toContain('api/ton/indexed-txs/route.js');
  });

  it('GET returns indexed transactions', async () => {
    const res = await tonIndexedTxsRoute(
      new Request(`http://test${TON_INDEXED_TXS_PATH}?address=${wallet}`, {
        method: 'GET',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: Array<{ txHash: string }> };
    expect(body.ok).toBe(true);
    expect(body.items[0]?.txHash).toBe('abc');
  });
});