import { gte, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { cronAuthResult } from '../../lib/cron';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { telegramSendMessage } from '../../telegram/lib';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, X-Cron-Secret');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const cron = cronAuthResult(req);
  if (!cron.ok) return jsonResponse(req, { error: cron.error }, cron.status);

  const db = getDb();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [leads] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.crmConversations)
    .where(gte(schema.crmConversations.createdAt, since7d));

  const [subs] = await db
    .select({
      total: sql<number>`count(*)`.as('total'),
      active: sql<number>`sum(case when ${schema.newsletterSubscriptions.status} = 'active' then 1 else 0 end)`.as('active'),
      pending: sql<number>`sum(case when ${schema.newsletterSubscriptions.status} = 'pending' then 1 else 0 end)`.as('pending'),
      unsub: sql<number>`sum(case when ${schema.newsletterSubscriptions.status} = 'unsubscribed' then 1 else 0 end)`.as('unsub'),
    })
    .from(schema.newsletterSubscriptions)
    .where(gte(schema.newsletterSubscriptions.createdAt, since7d));

  const [shares] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.shareEvents)
    .where(gte(schema.shareEvents.createdAt, since7d));

  const [referrals] = await db
    .select({ c: sql<number>`count(*)`.as('c') })
    .from(schema.referrals)
    .where(gte(schema.referrals.createdAt, since7d));

  const payload = {
    ok: true,
    since: since7d.toISOString(),
    leads7d: leads?.c ?? 0,
    newsletter7d: {
      total: subs?.total ?? 0,
      active: subs?.active ?? 0,
      pending: subs?.pending ?? 0,
      unsubscribed: subs?.unsub ?? 0,
    },
    shares7d: shares?.c ?? 0,
    referrals7d: referrals?.c ?? 0,
  };

  const botToken = env('TELEGRAM_BOT_TOKEN');
  const reportChatIdRaw = env('MARKETING_REPORT_TELEGRAM_CHAT_ID');
  const reportChatId = Number(reportChatIdRaw);
  if (botToken && Number.isFinite(reportChatId) && reportChatId > 0) {
    const msg =
      `Marketing weekly (7d)\n` +
      `Leads: ${payload.leads7d}\n` +
      `Newsletter: ${payload.newsletter7d.total} (active ${payload.newsletter7d.active}, pending ${payload.newsletter7d.pending})\n` +
      `Shares: ${payload.shares7d}\n` +
      `Referrals: ${payload.referrals7d}\n` +
      `Since: ${payload.since}`;
    try {
      await telegramSendMessage(botToken, reportChatId, msg);
    } catch {
      void 0;
    }
  }

  return jsonResponse(req, payload);
}
