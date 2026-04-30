import { corsJson, corsOptions } from '../../../lib/http';
import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from '../../../lib/tonapi';

export const config = { runtime: 'nodejs' };

type BackresolveResponse = { domains?: unknown };

function clampNetwork(v: string | null): TonNetwork {
  return parseTonNetwork(v);
}

function clampAccount(v: string | null): string | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  if (s.length > 120) return null;
  return s;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const network = clampNetwork(url.searchParams.get('network'));
  const account = clampAccount(url.searchParams.get('account'));
  if (!account) return corsJson(req, 400, { ok: false, error: 'Missing account' });

  const res = await fetchTonapiJson<BackresolveResponse>(
    network,
    `/v2/accounts/${encodeURIComponent(account)}/dns/backresolve`,
    { timeoutMs: 4500 },
  );
  if (!res.ok) return corsJson(req, 502, { ok: false, error: 'Upstream unavailable' });

  const domainsRaw = res.data.domains;
  const domains = Array.isArray(domainsRaw)
    ? domainsRaw
        .map((d) => (typeof d === 'string' ? d.trim() : ''))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  return corsJson(
    req,
    200,
    { ok: true, network, account, primary: domains[0] ?? null, domains },
    { 'Cache-Control': 'public, max-age=60' },
  );
}
