import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';
import { withRateLimit } from '../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function normalizeType(v: string) {
  const t = v.trim().toLowerCase();
  if (t === 'access' || t === 'portability' || t === 'delete' || t === 'rectification' || t === 'restriction' || t === 'objection')
    return t;
  return 'other';
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, allowedOrigin, { keyPrefix: 'gdpr_dsar', limit: 5, windowSeconds: 3600 });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const typeRaw = typeof (body as { type?: unknown })?.type === 'string' ? (body as { type: string }).type : '';
  const type = normalizeType(typeRaw);
  const messageRaw = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim() : '';
  const emailRaw = typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  const walletAddress =
    typeof (body as { walletAddress?: unknown })?.walletAddress === 'string'
      ? (body as { walletAddress: string }).walletAddress.trim().slice(0, 200)
      : '';
  const pageUrl = typeof (body as { pageUrl?: unknown })?.pageUrl === 'string' ? (body as { pageUrl: string }).pageUrl.trim().slice(0, 600) : null;
  const locale = typeof (body as { locale?: unknown })?.locale === 'string' ? (body as { locale: string }).locale.trim().slice(0, 12) : null;

  if (email && !isValidEmail(email)) return corsJson(req, 400, { error: 'Invalid email' });
  if (!messageRaw || messageRaw.length > 2000) return corsJson(req, 400, { error: 'Invalid message' });

  const user = await requireUser(req);
  if (!user && !email) return corsJson(req, 400, { error: 'Email required' });

  const db = getDb();

  const contact = email
    ? (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email, name: null })
          .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user?.id ?? null, email, name: null } })
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
      pageUrl,
      utm: { kind: 'dsar', type, walletAddress: walletAddress || null, locale: locale || null },
      updatedAt: new Date(),
    })
    .returning();

  const fullMessage = [
    `DSAR request`,
    `type: ${type}`,
    user ? `userId: ${user.id}` : null,
    user ? `wallet: ${user.walletAddress}` : walletAddress ? `wallet: ${walletAddress}` : null,
    email ? `email: ${email}` : null,
    '',
    messageRaw,
  ]
    .filter(Boolean)
    .join('\n');

  await db.insert(schema.crmMessages).values({
    conversationId: conv.id,
    sender: user ? 'user' : 'visitor',
    body: fullMessage.slice(0, 2400),
  });

  return corsJson(req, 200, { ok: true, conversationId: conv.id });
}
