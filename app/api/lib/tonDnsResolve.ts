import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from './tonapi';

export const TON_DNS_RESOLVE_PATH = '/api/ton/dns/resolve';
export const TON_DNS_RESOLVE_METHODS = 'GET, OPTIONS';

export const TON_DNS_RESOLVE_PROBE = {
  path: TON_DNS_RESOLVE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParams: ['name', 'network'] as const,
  cacheControl: 'public, max-age=60' as const,
  fetchTimeoutMs: 4500,
  maxNameLength: 140,
};

export function clampTonDnsResolveNetwork(v: string | null): TonNetwork {
  return parseTonNetwork(v);
}

export function clampTonDnsName(v: string | null): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s.length > TON_DNS_RESOLVE_PROBE.maxNameLength) return null;
  if (!/^[a-z0-9._-]+(\.ton)?$/.test(s)) return null;
  return s.endsWith('.ton') ? s : `${s}.ton`;
}

export function looksLikeTonAccountId(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('EQ') || t.startsWith('UQ')) return t.length >= 40 && t.length <= 80;
  if (/^[0-9a-fA-F]{2}:[0-9a-fA-F]{64}$/.test(t)) return true;
  return false;
}

export function extractTonDnsAccountId(raw: unknown): string | null {
  const stack: Array<{ v: unknown; depth: number }> = [{ v: raw, depth: 0 }];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) break;
    const { v, depth } = cur;
    if (depth > 4) continue;
    if (typeof v === 'string') {
      const s = v.trim();
      if (looksLikeTonAccountId(s)) return s;
      continue;
    }
    if (!v || typeof v !== 'object') continue;
    if (Array.isArray(v)) {
      for (const item of v) stack.push({ v: item, depth: depth + 1 });
      continue;
    }
    const obj = v as Record<string, unknown>;
    for (const k of Object.keys(obj)) {
      stack.push({ v: obj[k], depth: depth + 1 });
    }
  }
  return null;
}

export type TonDnsResolvePayload = {
  ok: true;
  network: TonNetwork;
  name: string;
  account: string | null;
  data: unknown;
};

export function buildTonDnsResolvePayload(network: TonNetwork, name: string, data: unknown): TonDnsResolvePayload {
  return { ok: true, network, name, account: extractTonDnsAccountId(data), data };
}

export async function fetchTonDnsResolve(
  network: TonNetwork,
  name: string,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
  const primary = await fetchTonapiJson<unknown>(network, `/v2/dns/${encodeURIComponent(name)}`, {
    timeoutMs: TON_DNS_RESOLVE_PROBE.fetchTimeoutMs,
  });
  const res = primary.ok
    ? primary
    : await fetchTonapiJson<unknown>(network, `/v2/dns/${encodeURIComponent(name)}/resolve`, {
        timeoutMs: TON_DNS_RESOLVE_PROBE.fetchTimeoutMs,
      });
  if (!res.ok) return { ok: false };
  return { ok: true, data: res.data };
}