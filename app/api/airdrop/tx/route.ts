import { AIRDROP_TX_PROBE, parseAirdropTxBody } from '@/api/lib/airdropTx';
import { getAllowedOrigin } from '@/api/lib/cors';
import { withRateLimit } from '@/api/lib/rateLimit';
import { tonAddressSchema } from '@/api/lib/validation';

export { AIRDROP_TX_PATH, AIRDROP_TX_PROBE } from '@/api/lib/airdropTx';

export const config = { runtime: 'nodejs' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (origin && allowedOrigin !== origin) {
    return jsonResponse({ ok: false, error: 'Forbidden' }, allowedOrigin, 403);
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: AIRDROP_TX_PROBE.rateLimitKey,
    limit: AIRDROP_TX_PROBE.rateLimit,
    windowSeconds: AIRDROP_TX_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, allowedOrigin, 400);
  }

  const { wallet: walletRaw, network } = parseAirdropTxBody(body);
  const parsed = tonAddressSchema.safeParse(walletRaw);
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: AIRDROP_TX_PROBE.invalidAddressError }, allowedOrigin, 400);
  }

  const to = (process.env.AIRDROP_CLAIM_CONTRACT ?? '').trim();
  if (!to) {
    return jsonResponse({ ok: false, error: AIRDROP_TX_PROBE.notConfiguredError, network }, allowedOrigin, 200);
  }

  const amountNanoTon = (process.env.AIRDROP_CLAIM_FEE_NANO_TON ?? '').trim() || '0';
  const payload = (process.env.AIRDROP_CLAIM_PAYLOAD_BASE64 ?? '').trim() || undefined;

  return jsonResponse({ ok: true, to, amountNanoTon, payload, network }, allowedOrigin, 200);
}