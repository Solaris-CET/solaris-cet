import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';
import { listTonIndexedTransactions, TON_INDEXED_TXS_PROBE } from '@/api/lib/tonIndexedTxs';
import { tonAddressSchema } from '@/api/lib/validation';

export { TON_INDEXED_TXS_PATH, TON_INDEXED_TXS_PROBE } from '@/api/lib/tonIndexedTxs';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, TON_INDEXED_TXS_PROBE.methods.join(', '));
  if (req.method !== 'GET') return corsJson(req, 405, { ok: false, error: 'Method not allowed' });

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: TON_INDEXED_TXS_PROBE.rateLimitKey,
    limit: TON_INDEXED_TXS_PROBE.rateLimit,
    windowSeconds: TON_INDEXED_TXS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const url = new URL(req.url);
  const addressRaw = (url.searchParams.get('address') ?? '').trim();
  const parsed = tonAddressSchema.safeParse(addressRaw);
  if (!parsed.success) return corsJson(req, 400, { ok: false, error: 'Invalid address' });
  const address = parsed.data.toString();

  const { network, items } = await listTonIndexedTransactions(address, url.searchParams.get('network'), url.searchParams.get('limit'));
  return corsJson(req, 200, { ok: true, network, address, items });
}