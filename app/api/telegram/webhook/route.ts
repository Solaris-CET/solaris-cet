import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { jsonResponse } from '../../lib/http';
import { awardPoints } from '../../lib/points';
import { parseCommand, telegramSendMessage, type TelegramUpdate } from '../lib';

export const config = { runtime: 'nodejs' };

function env(name: string): string {
  return String(process.env[name] ?? '').trim();
}

const spamWindows = new Map<string, { count: number; resetAtMs: number }>();

function allowChatCommand(chatId: number): boolean {
  const key = String(chatId);
  const now = Date.now();
  const existing = spamWindows.get(key);
  if (!existing || existing.resetAtMs <= now) {
    spamWindows.set(key, { count: 1, resetAtMs: now + 60_000 });
    return true;
  }
  existing.count += 1;
  return existing.count <= 12;
}

async function linkedUserId(db: ReturnType<typeof getDb>, chatId: number): Promise<string | null> {
  const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.chatId, String(chatId))).limit(1);
  return tg?.userId ?? null;
}

async function getChannelMembership(token: string, channel: string, userId: number): Promise<'member' | 'not_member' | 'unknown'> {
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${encodeURIComponent(
    String(userId),
  )}`;
  try {
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-store' } });
    const data = (await res.json().catch(() => null)) as { ok?: unknown; result?: unknown } | null;
    if (!data || data.ok !== true) return 'unknown';
    const status =
      data.result &&
      typeof data.result === 'object' &&
      'status' in data.result &&
      typeof (data.result as { status?: unknown }).status === 'string'
        ? (data.result as { status: string }).status
        : '';
    if (status === 'left' || status === 'kicked') return 'not_member';
    if (status) return 'member';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

async function handleTicket(db: ReturnType<typeof getDb>, chatId: number, token: string, args: string): Promise<void> {
  const userId = await linkedUserId(db, chatId);
  if (!userId) {
    await telegramSendMessage(token, chatId, 'Contul nu este conectat. Folosește /link <COD>.');
    return;
  }
  const body = args.trim();
  if (!body) {
    await telegramSendMessage(token, chatId, 'Scrie: /ticket <mesaj>');
    return;
  }
  const [c] = await db
    .insert(schema.crmConversations)
    .values({ userId, status: 'open', pageUrl: 'telegram', utm: { source: 'telegram', chatId: String(chatId) } })
    .returning({ id: schema.crmConversations.id });
  const conversationId = c?.id;
  if (conversationId) {
    await db.insert(schema.crmMessages).values({ conversationId, sender: 'user', body });
  }
  await telegramSendMessage(token, chatId, conversationId ? `Ticket creat: ${conversationId}` : 'Nu am putut crea ticket acum.');
}

async function handleQuiz(db: ReturnType<typeof getDb>, chatId: number, token: string): Promise<void> {
  const q = await db
    .select({ title: schema.quests.title, meta: schema.quests.meta })
    .from(schema.quests)
    .where(and(eq(schema.quests.slug, 'daily-quiz'), eq(schema.quests.active, true)))
    .limit(1);
  const quiz = q[0];
  const meta = (quiz?.meta ?? null) as Record<string, unknown> | null;
  const question = typeof meta?.question === 'string' ? meta.question : '';
  const options = Array.isArray(meta?.options) ? (meta.options as unknown[]).filter((x): x is string => typeof x === 'string') : [];
  if (!quiz || !question || options.length < 2) {
    await telegramSendMessage(token, chatId, 'Quiz indisponibil momentan.');
    return;
  }
  const letters = 'ABCDEFG';
  const lines = options.slice(0, 6).map((o, i) => `${letters[i]}. ${o}`);
  await telegramSendMessage(token, chatId, `${quiz.title}\n\n${question}\n\n${lines.join('\n')}\n\nRăspunde: /answer A`);
}

async function handleAnswer(db: ReturnType<typeof getDb>, chatId: number, token: string, args: string): Promise<void> {
  const userId = await linkedUserId(db, chatId);
  if (!userId) {
    await telegramSendMessage(token, chatId, 'Contul nu este conectat. Folosește /link <COD>.');
    return;
  }
  const choice = args.trim().toUpperCase().slice(0, 1);
  if (!choice) {
    await telegramSendMessage(token, chatId, 'Folosește: /answer A');
    return;
  }
  const q = await db
    .select({ pointsReward: schema.quests.pointsReward, meta: schema.quests.meta })
    .from(schema.quests)
    .where(and(eq(schema.quests.slug, 'daily-quiz'), eq(schema.quests.active, true)))
    .limit(1);
  const quiz = q[0];
  const meta = (quiz?.meta ?? null) as Record<string, unknown> | null;
  const correct = typeof meta?.correct === 'string' ? meta.correct.trim().toUpperCase().slice(0, 1) : '';
  if (!quiz || !correct) {
    await telegramSendMessage(token, chatId, 'Quiz indisponibil momentan.');
    return;
  }
  if (choice !== correct) {
    await telegramSendMessage(token, chatId, 'Răspuns greșit. Încearcă din nou cu /quiz.');
    return;
  }
  const day = new Date().toISOString().slice(0, 10);
  const delta = Math.max(1, Math.min(25, Math.floor(quiz.pointsReward ?? 3)));
  const { awarded } = await awardPoints(db, userId, delta, 'quiz', {
    dedupeKey: `quiz:${day}`,
    meta: { day, activity: 'quiz_answer' },
  });
  await telegramSendMessage(token, chatId, awarded ? `Corect. +${delta} XP` : 'Ai răspuns deja azi.');
}

async function handleGiveaways(db: ReturnType<typeof getDb>, chatId: number, token: string): Promise<void> {
  const rows = await db
    .select({ slug: schema.quests.slug, title: schema.quests.title, description: schema.quests.description })
    .from(schema.quests)
    .where(and(eq(schema.quests.actionKey, 'giveaway_enter'), eq(schema.quests.active, true)))
    .limit(5);
  if (rows.length === 0) {
    await telegramSendMessage(token, chatId, 'Nu există giveaway-uri active momentan.');
    return;
  }
  const lines = rows.map((r) => `• ${r.title} (${r.slug})${r.description ? `\n  ${r.description}` : ''}`);
  await telegramSendMessage(token, chatId, `Giveaway-uri active:\n${lines.join('\n')}\n\nIntră: /enter <slug>`);
}

async function handleEnterGiveaway(db: ReturnType<typeof getDb>, chatId: number, token: string, args: string): Promise<void> {
  const userId = await linkedUserId(db, chatId);
  if (!userId) {
    await telegramSendMessage(token, chatId, 'Contul nu este conectat. Folosește /link <COD>.');
    return;
  }
  const slug = args.trim().toLowerCase().slice(0, 80);
  if (!slug) {
    await telegramSendMessage(token, chatId, 'Folosește: /enter <slug>');
    return;
  }
  const [q] = await db
    .select({ pointsReward: schema.quests.pointsReward })
    .from(schema.quests)
    .where(and(eq(schema.quests.slug, slug), eq(schema.quests.actionKey, 'giveaway_enter'), eq(schema.quests.active, true)))
    .limit(1);
  if (!q) {
    await telegramSendMessage(token, chatId, 'Slug invalid sau giveaway inactiv.');
    return;
  }
  const delta = Math.max(0, Math.min(25, Math.floor(q.pointsReward ?? 1)));
  const { awarded } = await awardPoints(db, userId, delta, 'giveaway', {
    dedupeKey: `giveaway:${slug}`,
    meta: { activity: 'giveaway_enter', slug },
  });
  await telegramSendMessage(token, chatId, awarded ? `Ești înscris. +${delta} XP` : 'Ești deja înscris.');
}

async function handleJoinCheck(db: ReturnType<typeof getDb>, chatId: number, token: string): Promise<void> {
  const userId = await linkedUserId(db, chatId);
  if (!userId) {
    await telegramSendMessage(token, chatId, 'Contul nu este conectat. Folosește /link <COD>.');
    return;
  }
  const channel = env('TELEGRAM_CHANNEL_CHAT') || '@SolarisCET';
  const status = await getChannelMembership(token, channel, chatId);
  if (status !== 'member') {
    await telegramSendMessage(token, chatId, `Nu te văd ca membru în ${channel}. Intră în canal și reîncearcă.`);
    return;
  }
  const { awarded } = await awardPoints(db, userId, 2, 'channel', {
    dedupeKey: `channel:${channel}`,
    meta: { activity: 'channel_join', channel },
  });
  await telegramSendMessage(token, chatId, awarded ? 'Confirmat. +2 XP' : 'Deja revendicat.');
}

async function handleLink(db: ReturnType<typeof getDb>, chatId: number, username: string | null, code: string) {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, message: 'Cod invalid.' };
  const [row] = await db.select().from(schema.telegramLinkCodes).where(eq(schema.telegramLinkCodes.code, trimmed));
  if (!row) return { ok: false, message: 'Cod invalid sau expirat.' };
  if (row.usedAt) return { ok: false, message: 'Cod deja folosit.' };
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false, message: 'Cod expirat. Generează unul nou din site.' };

  const [existing] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.chatId, String(chatId)));
  if (existing) return { ok: false, message: 'Acest chat este deja conectat.' };

  await db.insert(schema.telegramLinks).values({
    userId: row.userId,
    chatId: String(chatId),
    username,
  });
  await db
    .update(schema.telegramLinkCodes)
    .set({ usedAt: new Date() })
    .where(eq(schema.telegramLinkCodes.code, trimmed));
  return { ok: true, message: 'Conectare reușită. Poți folosi /price și /events.' };
}

async function handleSubscribe(db: ReturnType<typeof getDb>, chatId: number, enabled: boolean) {
  const [tg] = await db.select().from(schema.telegramLinks).where(eq(schema.telegramLinks.chatId, String(chatId)));
  if (!tg) return { ok: false, message: 'Contul nu este conectat. Folosește /link <COD>.' };
  const [existing] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, tg.userId));
  if (existing) {
    await db
      .update(schema.userSettings)
      .set({ telegramNotificationsEnabled: enabled, updatedAt: new Date() })
      .where(eq(schema.userSettings.userId, tg.userId));
  } else {
    await db.insert(schema.userSettings).values({
      userId: tg.userId,
      telegramNotificationsEnabled: enabled,
      emailRemindersEnabled: false,
    });
  }
  return { ok: true, message: enabled ? 'Notificările Telegram sunt activate.' : 'Notificările Telegram sunt dezactivate.' };
}

async function handlePrice(): Promise<string> {
  const site = String(process.env.PUBLIC_SITE_URL ?? '').trim();
  const base = site ? site.replace(/\/$/, '') : 'https://solaris-cet.com';
  try {
    const res = await fetch(`${base}/api/price/cet`, { headers: { 'Accept': 'application/json' } });
    const data = (await res.json().catch(() => null)) as { priceTonPerCet?: unknown; updatedAt?: unknown } | null;
    const p = typeof data?.priceTonPerCet === 'string' ? data.priceTonPerCet : null;
    const t = typeof data?.updatedAt === 'string' ? data.updatedAt : null;
    if (!p) return 'Preț CET indisponibil momentan.';
    return `CET spot: ${p} TON/CET${t ? `\nUpdated: ${t}` : ''}`;
  } catch {
    return 'Preț CET indisponibil momentan.';
  }
}

async function handleEvents(): Promise<string> {
  const site = String(process.env.PUBLIC_SITE_URL ?? '').trim();
  const base = site ? site.replace(/\/$/, '') : 'https://solaris-cet.com';
  try {
    const res = await fetch(`${base}/api/events`, { headers: { 'Accept': 'application/json' } });
    const data = (await res.json().catch(() => null)) as { events?: unknown } | null;
    const list = Array.isArray(data?.events) ? (data?.events as unknown[]) : [];
    const items = list
      .slice(0, 3)
      .map((e) => {
        if (!e || typeof e !== 'object') return null;
        const title = typeof (e as { title?: unknown }).title === 'string' ? (e as { title: string }).title : 'Event';
        const startAt = typeof (e as { startAt?: unknown }).startAt === 'string' ? (e as { startAt: string }).startAt : '';
        const slug = typeof (e as { slug?: unknown }).slug === 'string' ? (e as { slug: string }).slug : '';
        const url = slug ? `${base}/evenimente/${slug}` : base;
        return `• ${title}${startAt ? `\n  ${startAt}` : ''}\n  ${url}`;
      })
      .filter((v): v is string => typeof v === 'string');
    if (items.length === 0) return 'Nu există evenimente publicate încă.';
    return `Evenimente următoare:\n${items.join('\n')}`;
  } catch {
    return 'Nu există evenimente publicate încă.';
  }
}

export default async function handler(req: Request): Promise<Response> {
  const token = env('TELEGRAM_BOT_TOKEN');
  const secret = env('TELEGRAM_WEBHOOK_SECRET');

  if (!token || !secret) return jsonResponse(req, { ok: true, configured: false });

  const provided = String(req.headers.get('x-telegram-bot-api-secret-token') ?? '').trim();
  if (!provided || provided !== secret) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const msg = update.message;
  const text = msg?.text;
  const chatId = typeof msg?.chat?.id === 'number' ? msg.chat.id : null;
  if (!chatId || typeof text !== 'string') return new Response(JSON.stringify({ ok: true }), { status: 200 });

  if (!allowChatCommand(chatId)) return new Response(JSON.stringify({ ok: true }), { status: 200 });

  const cmd = parseCommand(text);
  if (!cmd) return new Response(JSON.stringify({ ok: true }), { status: 200 });

  const db = getDb();
  const username = (msg?.chat?.username ?? msg?.from?.username ?? '').trim() || null;

  if (cmd.cmd === '/start' || cmd.cmd === '/help') {
    await telegramSendMessage(
      token,
      chatId,
      'Solaris CET bot. Comenzi: /price, /events, /link <COD>, /subscribe, /unsubscribe, /ticket <mesaj>, /quiz, /answer <A>, /giveaway, /enter <slug>, /joincheck',
    );
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/price') {
    await telegramSendMessage(token, chatId, await handlePrice());
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/events') {
    await telegramSendMessage(token, chatId, await handleEvents());
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/link') {
    const res = await handleLink(db, chatId, username, cmd.args);
    await telegramSendMessage(token, chatId, res.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/subscribe') {
    const res = await handleSubscribe(db, chatId, true);
    await telegramSendMessage(token, chatId, res.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/unsubscribe') {
    const res = await handleSubscribe(db, chatId, false);
    await telegramSendMessage(token, chatId, res.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/ticket') {
    await handleTicket(db, chatId, token, cmd.args);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/quiz') {
    await handleQuiz(db, chatId, token);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/answer') {
    await handleAnswer(db, chatId, token, cmd.args);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/giveaway') {
    await handleGiveaways(db, chatId, token);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/enter') {
    await handleEnterGiveaway(db, chatId, token, cmd.args);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (cmd.cmd === '/joincheck') {
    await handleJoinCheck(db, chatId, token);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  await telegramSendMessage(token, chatId, 'Comandă necunoscută. /help');
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
