import { eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { corsJson, optionsResponse, readJson } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';
import { withRateLimit } from '../../lib/rateLimit';
import { verifyTelegramInitData } from '../../telegram/initData';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

function todayKeyUtc(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') return optionsResponse(req, 'POST, OPTIONS', 'Content-Type, X-Telegram-Init-Data');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const limited = await withRateLimit(req, guard.allowedOrigin, {
    keyPrefix: 'community-share-ai',
    limit: 10,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const initData = String(req.headers.get('x-telegram-init-data') ?? '').trim();
  if (!initData) return corsJson(req, 401, { error: 'Missing Telegram initData' });

  const botToken = env('TELEGRAM_BOT_TOKEN');
  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified.ok) return corsJson(req, 401, { error: 'Invalid Telegram initData', code: verified.error });

  const tgId = verified.user?.id;
  if (!tgId) return corsJson(req, 401, { error: 'Missing Telegram user' });

  const db = getDb();
  const [link] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.chatId, String(tgId))).limit(1);
  if (!link) return corsJson(req, 401, { error: 'Telegram not linked', notLinked: true });

  const context = await readJson(req)
    .then((body) => {
      if (typeof body !== 'object' || body === null) return 'cet-ai';
      if (!('context' in body)) return 'cet-ai';
      const v = (body as { context?: unknown }).context;
      if (typeof v !== 'string') return 'cet-ai';
      const t = v.trim();
      return t ? t.slice(0, 80) : 'cet-ai';
    })
    .catch(() => 'cet-ai');

  const day = todayKeyUtc();
  const { awarded } = await awardPoints(db, link.userId, 5, 'share', {
    dedupeKey: `share-ai:${day}`,
    meta: { day, platform: 'telegram', activity: 'ai_share', context },
  });

  return corsJson(req, 200, { ok: true, duplicated: !awarded });
}
