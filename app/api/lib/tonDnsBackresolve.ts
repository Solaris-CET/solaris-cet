import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from './tonapi';

export const TON_DNS_BACKRESOLVE_PATH = '/api/ton/dns/backresolve';
export const TON_DNS_BACKRESOLVE_METHODS = 'GET, OPTIONS';

export const TON_DNS_BACKRESOLVE_PROBE = {
  path: TON_DNS_BACKRESOLVE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParams: ['account', 'network'] as const,
  maxDomains: 20,
  cacheControl: 'public, max-age=60' as const,
  fetchTimeoutMs: 4500,
};

export function clampTonDnsNetwork(v: string | null): TonNetwork {
  return parseTonNetwork(v);
}

export function clampTonDnsAccount(v: string | null): string | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (s.length > 120) return null;
  return s;
}

export function extractTonDnsDomains(raw: unknown, max = TON_DNS_BACKRESOLVE_PROBE.maxDomains): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => (typeof d === 'string' ? d.trim() : ''))
    .filter(Boolean)
    .slice(0, max);
}

export type TonDnsBackresolvePayload = {
  ok: true;
  network: TonNetwork;
  account: string;
  primary: string | null;
  domains: string[];
};

export function buildTonDnsBackresolvePayload(network: TonNetwork, account: string, domains: string[]): TonDnsBackresolvePayload {
  return { ok: true, network, account, primary: domains[0] ?? null, domains };
}

export async function fetchTonDnsBackresolve(
  network: TonNetwork,
  account: string,
): Promise<{ ok: true; domains: string[] } | { ok: false }> {
  const res = await fetchTonapiJson<{ domains?: unknown }>(
    network,
    `/v2/accounts/${encodeURIComponent(account)}/dns/backresolve`,
    { timeoutMs: TON_DNS_BACKRESOLVE_PROBE.fetchTimeoutMs },
  );
  if (!res.ok) return { ok: false };
  return { ok: true, domains: extractTonDnsDomains(res.data.domains) };
}