import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import {
  buildGdprDsarMessage,
  GDPR_DSAR_PROBE,
  normalizeGdprDsarType,
  parseGdprDsarPostBody,
} from '../../lib/gdprDsar';
import { corsJson, corsOptions, isValidEmail, readJson } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export { GDPR_DSAR_PATH, GDPR_DSAR_PROBE } from '@/api/lib/gdprDsar';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, GDPR_DSAR_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: GDPR_DSAR_PROBE.rateLimitKey,
    limit: GDPR_DSAR_PROBE.rateLimit,
    windowSeconds: GDPR_DSAR_PROBE.rateLimitWindowSeconds,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: GDPR_DSAR_PROBE.invalidJsonError });
  }

  const parsed = parseGdprDsarPostBody(body);
  const type = normalizeGdprDsarType(parsed.type);

  if (parsed.email && !isValidEmail(parsed.email)) return corsJson(req, 400, { error: GDPR_DSAR_PROBE.invalidEmailError });
  if (!parsed.message || parsed.message.length > GDPR_DSAR_PROBE.maxMessageLength) {
    return corsJson(req, 400, { error: GDPR_DSAR_PROBE.invalidMessageError });
  }

  const user = await requireUser(req);
  if (!user && !parsed.email) return corsJson(req, 400, { error: GDPR_DSAR_PROBE.emailRequiredError });

  const db = getDb();

  const contact = parsed.email
    ? (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email: parsed.email, name: null })
          .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user?.id ?? null, email: parsed.email, name: null } })
          .returning()
      )[0]
    : (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email: null, name: null })
          .returning()
      )[0];

  const [conv] = await db
    .insert(schema.crmConversations)
    .values({
      contactId: contact.id,
      userId: user?.id ?? null,
      status: 'open',
      pageUrl: parsed.pageUrl,
      utm: { kind: GDPR_DSAR_PROBE.utmKind, type, walletAddress: parsed.walletAddress || null, locale: parsed.locale || null },
      updatedAt: new Date(),
    })
    .returning();

  const fullMessage = buildGdprDsarMessage(parsed, type, user);

  await db.insert(schema.crmMessages).values({
    conversationId: conv.id,
    sender: user ? 'user' : 'visitor',
    body: fullMessage,
  });

  return corsJson(req, 200, { ok: true, conversationId: conv.id });
}