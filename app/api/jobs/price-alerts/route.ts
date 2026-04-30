import { and, eq, inArray, isNotNull } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { fetchCetPriceUsd } from '../../lib/cetPrice';
import { getAllowedOrigin } from '../../lib/cors';
import { requireCron } from '../../lib/cron';
import { priceAlertEmail } from '../../lib/emailTemplates';
import { corsJson, corsOptions } from '../../lib/http';
import { fetchTonPriceUsd } from '../../lib/tonPrice';
import { telegramSendMessage } from '../../telegram/lib';

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

  const [{ priceUsd: cetPriceUsd, source: cetSource }, { priceUsd: tonPriceUsd, source: tonSource }] = await Promise.all([
    fetchCetPriceUsd(),
    fetchTonPriceUsd(),
  ]);
  const prices: Record<'CET' | 'TON', { priceUsd: number; source: string }> = {
    CET: { priceUsd: cetPriceUsd, source: cetSource },
    TON: { priceUsd: tonPriceUsd, source: tonSource },
  };

  const db = getDb();
  const alerts = await db
    .select()
    .from(schema.priceAlerts)
    .where(inArray(schema.priceAlerts.asset, ['CET', 'TON']))
    .limit(500);
  let triggered = 0;
  let emailQueued = 0;
  let telegramSent = 0;
  const botToken = String(process.env.TELEGRAM_BOT_TOKEN ?? '').trim();

  for (const a of alerts) {
    const asset = a.asset === 'TON' ? 'TON' : 'CET';
    const { priceUsd, source } = prices[asset];
    if (!priceUsd) continue;

    const target = Number(a.targetUsd);
    if (!Number.isFinite(target) || target <= 0) continue;

    const isHit = a.direction === 'above' ? priceUsd >= target : priceUsd <= target;
    if (!isHit) continue;

    const last = a.lastSentAt ? a.lastSentAt.getTime() : 0;
    const cooldownMs = Math.max(1, a.cooldownMinutes) * 60 * 1000;
    if (last && Date.now() - last < cooldownMs) continue;

    if (a.channel === 'email') {
      const [contact] = await db
        .select()
        .from(schema.contacts)
        .where(and(eq(schema.contacts.userId, a.userId), isNotNull(schema.contacts.email)))
        .limit(1);
      const toEmail = contact?.email;
      if (!toEmail) continue;

      const tpl = priceAlertEmail(req, {
        direction: a.direction,
        targetUsd: String(a.targetUsd),
        priceUsd: priceUsd.toFixed(6).replace(/0+$/, '').replace(/\.$/, ''),
      });
      await db.insert(schema.emailOutbox).values({
        toEmail,
        template: 'price_alert',
        subject: tpl.subject,
        html: tpl.html,
        textBody: tpl.text,
        payload: { asset, priceUsd, targetUsd: a.targetUsd, direction: a.direction, source },
      });
      emailQueued += 1;
    } else {
      if (!botToken) continue;
      const [settings] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, a.userId));
      if (settings && settings.telegramNotificationsEnabled === false) continue;
      const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.userId, a.userId));
      const chatId = tg?.chatId ? Number(tg.chatId) : 0;
      if (!chatId) continue;
      const priceText = priceUsd.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
      const targetText = String(a.targetUsd);
      const directionText = a.direction === 'above' ? 'peste' : 'sub';
      try {
        await telegramSendMessage(
          botToken,
          chatId,
          `Alertă preț ${asset}: ${directionText} $${targetText}\nAcum: $${priceText}\nSursă: ${source}`,
        );
        telegramSent += 1;
      } catch {
        continue;
      }
    }

    await db
      .update(schema.priceAlerts)
      .set({ lastSentAt: new Date() })
      .where(and(eq(schema.priceAlerts.id, a.id), eq(schema.priceAlerts.userId, a.userId)));
    triggered += 1;
  }

  return corsJson(req, 200, {
    ok: true,
    prices,
    triggered,
    emailQueued,
    telegramSent,
  });
}
