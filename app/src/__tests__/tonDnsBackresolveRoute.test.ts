// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildTonDnsBackresolvePayload,
  clampTonDnsAccount,
  extractTonDnsDomains,
  TON_DNS_BACKRESOLVE_PATH,
  TON_DNS_BACKRESOLVE_PROBE,
} from '../../api/lib/tonDnsBackresolve';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/tonDnsBackresolve', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/lib/tonDnsBackresolve')>();
  return {
    ...actual,
    fetchTonDnsBackresolve: vi.fn(async () => ({ ok: true as const, domains: ['wallet.ton'] })),
  };
});

import tonDnsBackresolveRoute, { TON_DNS_BACKRESOLVE_PROBE as routeProbe } from '../../api/ton/dns/backresolve/route';

describe('tonDnsBackresolve helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TON_DNS_BACKRESOLVE_PROBE.path).toBe('/api/ton/dns/backresolve');
    expect(routeProbe.maxDomains).toBe(20);
  });

  it('clampTonDnsAccount rejects empty values', () => {
    expect(clampTonDnsAccount('')).toBeNull();
    expect(clampTonDnsAccount('EQabc')).toBe('EQabc');
  });

  it('extractTonDnsDomains trims and caps', () => {
    expect(extractTonDnsDomains([' a.ton ', 'b.ton'])).toEqual(['a.ton', 'b.ton']);
    expect(buildTonDnsBackresolvePayload('mainnet', 'EQabc', ['a.ton']).primary).toBe('a.ton');
  });
});

describe('/api/ton/dns/backresolve e2e probe', () => {
  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TON_DNS_BACKRESOLVE_PATH);
    expect(src).toContain('api/ton/dns/backresolve/route.js');
  });

  it('GET resolves domains for account', async () => {
    const res = await tonDnsBackresolveRoute(
      new Request(`http://test${TON_DNS_BACKRESOLVE_PATH}?account=EQabc`, { method: 'GET', headers: { origin: 'https://allowed.test' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; domains: string[] };
    expect(body.ok).toBe(true);
    expect(body.domains).toContain('wallet.ton');
  });
});