import { getDb, schema } from '@/db/client';
import { CONSENT_PROBE, parseConsentPostBody } from '@/api/lib/consent';
import { requireUser } from '@/api/lib/authUser';
import { clientIp } from '@/api/lib/clientIp';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import { sha256Hex } from '@/api/lib/nodeCrypto';
import { withRateLimit } from '@/api/lib/rateLimit';

export { CONSENT_PATH, CONSENT_PROBE } from '@/api/lib/consent';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, CONSENT_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const rl = await withRateLimit(req, allowedOrigin, {
    keyPrefix: CONSENT_PROBE.rateLimitKey,
    limit: CONSENT_PROBE.rateLimit,
    windowSeconds: CONSENT_PROBE.rateWindowSeconds,
  });
  if (rl) return rl;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: CONSENT_PROBE.invalidJsonError });
  }

  const parsed = parseConsentPostBody(body);
  if (!parsed) return corsJson(req, 400, { error: CONSENT_PROBE.invalidPayloadError });

  const user = await requireUser(req);
  const userId = user?.id ?? null;

  const ua = req.headers.get('user-agent')?.trim() ?? '';
  const userAgent = ua ? ua.slice(0, CONSENT_PROBE.maxUserAgentLength) : null;

  const ipSalt = String(process.env.CONSENT_IP_SALT ?? process.env.ANALYTICS_IP_SALT ?? '').trim();
  const ip = clientIp(req);
  const ipHash = ipSalt ? sha256Hex(`${ipSalt}|${ip}`) : null;

  const db = getDb();
  const [row] = await db
    .insert(schema.consentProofs)
    .values({
      consentKey: parsed.consentKey,
      userId,
      essential: CONSENT_PROBE.essentialConsent,
      analytics: parsed.consent.analytics,
      marketing: parsed.consent.marketing,
      policyVersion: parsed.policyVersion,
      policyHash: parsed.policyHash,
      source: parsed.source,
      ipHash,
      userAgent,
      meta: parsed.meta,
      createdAt: new Date(),
    })
    .returning({ id: schema.consentProofs.id });

  return corsJson(req, 201, { ok: true, id: row?.id ?? null });
}