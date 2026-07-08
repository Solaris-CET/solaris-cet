import { corsJson, corsOptions } from '@/api/lib/http';
import {
  buildTonDnsBackresolvePayload,
  clampTonDnsAccount,
  clampTonDnsNetwork,
  fetchTonDnsBackresolve,
  TON_DNS_BACKRESOLVE_PROBE,
} from '../../../lib/tonDnsBackresolve';

export { TON_DNS_BACKRESOLVE_PATH, TON_DNS_BACKRESOLVE_PROBE } from '@/api/lib/tonDnsBackresolve';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, TON_DNS_BACKRESOLVE_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const url = new URL(req.url);
  const network = clampTonDnsNetwork(url.searchParams.get('network'));
  const account = clampTonDnsAccount(url.searchParams.get('account'));
  if (!account) return corsJson(req, 400, { ok: false, error: 'Missing account' });

  const res = await fetchTonDnsBackresolve(network, account);
  if (!res.ok) return corsJson(req, 502, { ok: false, error: 'Upstream unavailable' });

  return corsJson(req, 200, buildTonDnsBackresolvePayload(network, account, res.domains), {
    'Cache-Control': TON_DNS_BACKRESOLVE_PROBE.cacheControl,
  });
}