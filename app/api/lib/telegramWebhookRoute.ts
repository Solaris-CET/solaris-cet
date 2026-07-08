import type { TelegramUpdate } from '../telegram/lib';

export const TELEGRAM_WEBHOOK_PATH = '/api/telegram/webhook';
export const TELEGRAM_WEBHOOK_METHODS = 'POST';

export const TELEGRAM_WEBHOOK_PROBE = {
  path: TELEGRAM_WEBHOOK_PATH,
  methods: ['POST'] as const,
  authRequired: true,
  secretHeader: 'x-telegram-bot-api-secret-token' as const,
  botTokenEnv: 'TELEGRAM_BOT_TOKEN' as const,
  webhookSecretEnv: 'TELEGRAM_WEBHOOK_SECRET' as const,
  forbiddenStatus: 403,
  notConfiguredResponse: { ok: true as const, configured: false as const },
  spamLimit: 12,
  spamWindowMs: 60_000,
  defaultSiteUrl: 'https://solaris-cet.com' as const,
  publicSiteUrlEnv: 'PUBLIC_SITE_URL' as const,
  channelChatEnv: 'TELEGRAM_CHANNEL_CHAT' as const,
  defaultChannelChat: '@SolarisCET' as const,
};

export function readTrimmedTelegramEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  return String(env[name] ?? '').trim();
}

export function isTelegramWebhookConfigured(
  token = readTrimmedTelegramEnv(TELEGRAM_WEBHOOK_PROBE.botTokenEnv),
  secret = readTrimmedTelegramEnv(TELEGRAM_WEBHOOK_PROBE.webhookSecretEnv),
): boolean {
  return Boolean(token && secret);
}

export function validateTelegramWebhookSecret(
  req: Request,
  expected = readTrimmedTelegramEnv(TELEGRAM_WEBHOOK_PROBE.webhookSecretEnv),
): boolean {
  const provided = String(req.headers.get(TELEGRAM_WEBHOOK_PROBE.secretHeader) ?? '').trim();
  return Boolean(provided && expected && provided === expected);
}

export type TelegramMessageContext = {
  chatId: number;
  text: string;
  username: string | null;
};

export function extractTelegramMessageContext(update: TelegramUpdate): TelegramMessageContext | null {
  const msg = update.message;
  const text = msg?.text;
  const chatId = typeof msg?.chat?.id === 'number' ? msg.chat.id : null;
  if (!chatId || typeof text !== 'string') return null;
  const username = (msg?.chat?.username ?? msg?.from?.username ?? '').trim() || null;
  return { chatId, text, username };
}

const spamWindows = new Map<string, { count: number; resetAtMs: number }>();

export function allowTelegramChatCommand(
  chatId: number,
  now = Date.now(),
  limit = TELEGRAM_WEBHOOK_PROBE.spamLimit,
  windowMs = TELEGRAM_WEBHOOK_PROBE.spamWindowMs,
): boolean {
  const key = String(chatId);
  const existing = spamWindows.get(key);
  if (!existing || existing.resetAtMs <= now) {
    spamWindows.set(key, { count: 1, resetAtMs: now + windowMs });
    return true;
  }
  existing.count += 1;
  return existing.count <= limit;
}

export function __resetTelegramWebhookSpamForTests(): void {
  spamWindows.clear();
}

export function resolveTelegramPublicSiteBase(env: NodeJS.ProcessEnv = process.env): string {
  const site = readTrimmedTelegramEnv(TELEGRAM_WEBHOOK_PROBE.publicSiteUrlEnv, env);
  return site ? site.replace(/\/$/, '') : TELEGRAM_WEBHOOK_PROBE.defaultSiteUrl;
}

export function resolveTelegramChannelChat(env: NodeJS.ProcessEnv = process.env): string {
  return readTrimmedTelegramEnv(TELEGRAM_WEBHOOK_PROBE.channelChatEnv, env) || TELEGRAM_WEBHOOK_PROBE.defaultChannelChat;
}