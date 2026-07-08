// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { mapTonNftItem, TON_NFTS_PATH, TON_NFTS_PROBE } from '../../api/lib/tonNfts';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/tonNfts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonNfts')>();
  return {
    ...actual,
    fetchTonNftsForOwner: vi.fn(async (owner: string) => ({
      ok: true as const,
      owner,
      network: 'mainnet' as const,
      items: [{ address: 'EQnft1234567890123456789012345678901234567890', name: 'CET Badge' }],
    })),
  };
});

import tonNftsRoute, { TON_NFTS_PROBE as routeProbe } from '../../api/ton/nfts/route';

const wallet = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

describe('tonNfts helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_NFTS_PROBE.path).toBe('/api/ton/nfts');
    expect(routeProbe.runtime).toBe('edge');
  });

  it('mapTonNftItem extracts metadata', () => {
    const item = mapTonNftItem({
      address: 'EQnft1234567890123456789012345678901234567890',
      metadata: { name: 'Badge', image: 'ipfs://img' },
      collection: { address: 'EQcol', metadata: { name: 'Collection' } },
    });
    expect(item?.name).toBe('Badge');
    expect(item?.collectionName).toBe('Collection');
  });
});

describe('/api/ton/nfts e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_NFTS_PATH);
    expect(src).toContain('api/ton/nfts/route.js');
  });

  it('GET returns NFT items', async () => {
    const res = await tonNftsRoute(
      new Request(`http://test${TON_NFTS_PATH}?owner=${wallet}`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; items: Array<{ name?: string }> };
    expect(body.ok).toBe(true);
    expect(body.items[0]?.name).toBe('CET Badge');
  });
});