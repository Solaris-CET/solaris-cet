import { corsJson, corsOptions } from '@/api/lib/http';
import {
  buildTonDnsResolvePayload,
  clampTonDnsName,
  clampTonDnsResolveNetwork,
  fetchTonDnsResolve,
  TON_DNS_RESOLVE_PROBE,
} from '../../../lib/tonDnsResolve';

export { TON_DNS_RESOLVE_PATH, TON_DNS_RESOLVE_PROBE } from '@/api/lib/tonDnsResolve';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, TON_DNS_RESOLVE_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const network = clampTonDnsResolveNetwork(url.searchParams.get('network'));
  const name = clampTonDnsName(url.searchParams.get('name'));
  if (!name) return corsJson(req, 400, { ok: false, error: 'Missing name' });

  const res = await fetchTonDnsResolve(network, name);
  if (!res.ok) return corsJson(req, 502, { ok: false, error: 'Upstream unavailable' });

  return corsJson(req, 200, buildTonDnsResolvePayload(network, name, res.data), {
    'Cache-Control': TON_DNS_RESOLVE_PROBE.cacheControl,
  });
}