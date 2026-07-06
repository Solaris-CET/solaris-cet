import { getDb, schema } from '../../db/client';
import { requireUser } from '../lib/authUser';
import { clientIp } from '../lib/clientIp';
import { getAllowedOrigin } from '../lib/cors';
import { corsJson, corsOptions, readJson } from '../lib/http';
import { sha256Hex } from '../lib/nodeCrypto';
import { withRateLimit } from '../lib/rateLimit';

export const config = { runtime: 'nodejs' };

type IncomingConsent = {
  analytics: boolean;
  marketing: boolean;
};

function parseIncoming(body: unknown): {
  consentKey: string;
  consent: IncomingConsent;
  policyVersion: string;
  policyHash: string | null;
  source: string;
  meta: Record<string, unknown> | null;
} | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  const consentKey = typeof rec.consentKey === 'string' ? rec.consentKey.trim() : '';
  if (!consentKey || consentKey.length > 120) return null;

  const consentRaw = rec.consent;
  if (!consentRaw || typeof consentRaw !== 'object') return null;
  const c = consentRaw as Record<string, unknown>;
  const analytics = Boolean(c.analytics);
  const marketing = Boolean(c.marketing);

  const policyVersion = typeof rec.policyVersion === 'string' ? rec.policyVersion.trim() : '';
  if (!policyVersion || policyVersion.length > 40) return null;
  const policyHash = typeof rec.policyHash === 'string' && rec.policyHash.trim() ? rec.policyHash.trim().slice(0, 128) : null;

  const sourceRaw = typeof rec.source === 'string' ? rec.source.trim() : '';
  const source = sourceRaw ? sourceRaw.slice(0, 60) : 'unknown';

  const metaRaw = rec.meta;
  const meta = metaRaw && typeof metaRaw === 'object' ? (metaRaw as Record<string, unknown>) : null;

  return { consentKey, consent: { analytics, marketing }, policyVersion, policyHash, source, meta };
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const rl = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'consent',
    limit: 120,
    windowSeconds: 60,
  });
  if (rl) return rl;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const parsed = parseIncoming(body);
  if (!parsed) return corsJson(req, 400, { error: 'Invalid payload' });

  const user = await requireUser(req);
  const userId = user?.id ?? null;

  const ua = req.headers.get('user-agent')?.trim() ?? '';
  const userAgent = ua ? ua.slice(0, 220) : null;

  const ipSalt = String(process.env.CONSENT_IP_SALT ?? process.env.ANALYTICS_IP_SALT ?? '').trim();
  const ip = clientIp(req);
  const ipHash = ipSalt ? sha256Hex(`${ipSalt}|${ip}`) : null;

  const db = getDb();
  const [row] = await db
    .insert(schema.consentProofs)
    .values({
      consentKey: parsed.consentKey,
      userId,
      essential: true,
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

