import {
  AIRDROP_PROOF_PROBE,
  parseAirdropProofNetwork,
  parseAirdropProofsEnv,
  parseAirdropProofWallet,
} from '../../lib/airdropProof';
import { getAllowedOrigin } from '@/api/lib/cors';
import { withRateLimit } from '@/api/lib/rateLimit';
import { tonAddressSchema } from '@/api/lib/validation';

export { AIRDROP_PROOF_PATH, AIRDROP_PROOF_PROBE } from '@/api/lib/airdropProof';

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

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, allowedOrigin, 405);
  }

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: AIRDROP_PROOF_PROBE.rateLimitKey,
    limit: AIRDROP_PROOF_PROBE.rateLimit,
    windowSeconds: AIRDROP_PROOF_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  const searchParams = new URL(req.url).searchParams;
  const walletRaw = parseAirdropProofWallet(searchParams);
  const network = parseAirdropProofNetwork(searchParams);
  const parsed = tonAddressSchema.safeParse(walletRaw);
  if (!parsed.success) {
    return jsonResponse(
      { ok: false, eligible: false, wallet: walletRaw, error: AIRDROP_PROOF_PROBE.invalidAddressError },
      allowedOrigin,
      400,
    );
  }
  const wallet = parsed.data.toString();

  const merkleRoot = (process.env.AIRDROP_MERKLE_ROOT ?? '').trim();
  const expiresAt = (process.env.AIRDROP_EXPIRES_AT ?? '').trim();
  const proofs = parseAirdropProofsEnv();
  if (!merkleRoot || !proofs) {
    return jsonResponse(
      { ok: false, eligible: false, wallet, error: AIRDROP_PROOF_PROBE.notConfiguredError, network },
      allowedOrigin,
      200,
    );
  }

  const rec = proofs[wallet];
  if (!rec) {
    return jsonResponse(
      { ok: true, eligible: false, wallet, merkleRoot, expiresAt: expiresAt || undefined, network },
      allowedOrigin,
      200,
    );
  }

  return jsonResponse(
    {
      ok: true,
      eligible: true,
      wallet,
      amountNanoCET: rec.amountNanoCET,
      merkleRoot,
      proof: rec.proof,
      index: rec.index,
      expiresAt: expiresAt || undefined,
      network,
    },
    allowedOrigin,
    200,
  );
}