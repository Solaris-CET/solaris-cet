import { and, eq, lte } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { getAllowedOrigin } from '../../lib/cors';
import { requireCron } from '../../lib/cron';
import { sendEmail } from '../../lib/emailProvider';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!requireCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  const now = new Date();
  const pending = await db
    .select()
    .from(schema.emailOutbox)
    .where(and(eq(schema.emailOutbox.status, 'pending'), lte(schema.emailOutbox.sendAfter, now)))
    .limit(20);

  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      await sendEmail({ to: row.toEmail, subject: row.subject, html: row.html, text: row.textBody });
      await db
        .update(schema.emailOutbox)
        .set({ status: 'sent', sentAt: new Date(), lastError: null })
        .where(eq(schema.emailOutbox.id, row.id));
      sent += 1;
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e).slice(0, 1200);
      await db
        .update(schema.emailOutbox)
        .set({ status: 'failed', lastError: msg })
        .where(eq(schema.emailOutbox.id, row.id));
      failed += 1;
    }
  }

  return corsJson(req, 200, { ok: true, processed: pending.length, sent, failed });
}
