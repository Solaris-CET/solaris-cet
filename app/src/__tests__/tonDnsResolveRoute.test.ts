// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildTonDnsResolvePayload,
  clampTonDnsName,
  extractTonDnsAccountId,
  looksLikeTonAccountId,
  TON_DNS_RESOLVE_PATH,
  TON_DNS_RESOLVE_PROBE,
} from '../../api/lib/tonDnsResolve';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/tonDnsResolve', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonDnsResolve')>();
  return {
    ...actual,
    fetchTonDnsResolve: vi.fn(async () => ({
      ok: true as const,
      data: { wallet: { address: 'EQTestWalletAddress1234567890123456789012345' } },
    })),
  };
});

import tonDnsResolveRoute, { TON_DNS_RESOLVE_PROBE as routeProbe } from '../../api/ton/dns/resolve/route';

describe('tonDnsResolve helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_DNS_RESOLVE_PROBE.path).toBe('/api/ton/dns/resolve');
    expect(routeProbe.maxNameLength).toBe(140);
  });

  it('clampTonDnsName normalizes .ton suffix', () => {
    expect(clampTonDnsName('wallet')).toBe('wallet.ton');
    expect(clampTonDnsName('wallet.ton')).toBe('wallet.ton');
  });

  it('extractTonDnsAccountId finds nested account ids', () => {
    const account = 'EQTestWalletAddress1234567890123456789012345';
    expect(looksLikeTonAccountId(account)).toBe(true);
    expect(extractTonDnsAccountId({ wallet: { address: account } })).toBe(account);
    expect(buildTonDnsResolvePayload('mainnet', 'wallet.ton', { address: account }).account).toBe(account);
  });
});

describe('/api/ton/dns/resolve e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_DNS_RESOLVE_PATH);
    expect(src).toContain('api/ton/dns/resolve/route.js');
  });

  it('GET resolves name to account', async () => {
    const res = await tonDnsResolveRoute(
      new Request(`http://test${TON_DNS_RESOLVE_PATH}?name=wallet`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; name: string; account: string | null };
    expect(body.ok).toBe(true);
    expect(body.name).toBe('wallet.ton');
    expect(body.account).toContain('EQ');
  });
});