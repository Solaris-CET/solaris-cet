import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, isValidEmail, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req);
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const message = typeof (body as { message?: unknown })?.message === 'string' ? (body as { message: string }).message.trim() : '';
  const name = typeof (body as { name?: unknown })?.name === 'string' ? (body as { name: string }).name.trim().slice(0, 120) : null;
  const emailRaw = typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
  const email = emailRaw ? emailRaw.toLowerCase() : '';
  const pageUrl = typeof (body as { pageUrl?: unknown })?.pageUrl === 'string' ? (body as { pageUrl: string }).pageUrl.trim().slice(0, 600) : null;
  const utm = (body as { utm?: unknown })?.utm;

  if (!message || message.length > 2000) return corsJson(req, 400, { error: 'Invalid message' });
  if (email && !isValidEmail(email)) return corsJson(req, 400, { error: 'Invalid email' });

  const user = await requireUser(req);
  const db = getDb();

  const contact = email
    ? (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email, name: name ?? null })
          .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user?.id ?? null, email, name: name ?? null } })
          .returning()
      )[0]
    : (
        await db
          .insert(schema.contacts)
          .values({ userId: user?.id ?? null, email: null, name: name ?? null })
          .returning()
      )[0];

  const [conv] = await db
    .insert(schema.crmConversations)
    .values({
      contactId: contact.id,
      userId: user?.id ?? null,
      status: 'open',
      pageUrl,
      utm: utm && typeof utm === 'object' ? (utm as Record<string, unknown>) : null,
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(schema.crmMessages).values({
    conversationId: conv.id,
    sender: user ? 'user' : 'visitor',
    body: message,
  });

  if (user && email) {
    await db
      .insert(schema.contacts)
      .values({ userId: user.id, email, name: name ?? null })
      .onConflictDoUpdate({ target: schema.contacts.email, set: { userId: user.id, email, name: name ?? null } });
  }

  return new Response(JSON.stringify({ ok: true, conversationId: conv.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
  });
}
