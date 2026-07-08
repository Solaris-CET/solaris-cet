// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetTelegramWebhookSpamForTests,
  allowTelegramChatCommand,
  extractTelegramMessageContext,
  isTelegramWebhookConfigured,
  TELEGRAM_WEBHOOK_PATH,
  TELEGRAM_WEBHOOK_PROBE,
  validateTelegramWebhookSecret,
} from '../../api/lib/telegramWebhookRoute';

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/telegram/lib', () => ({
  parseCommand: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) return null;
    const [rawCmd, ...rest] = trimmed.split(' ');
    return { cmd: (rawCmd ?? '').toLowerCase(), args: rest.join(' ').trim() };
  },
  telegramSendMessage: vi.fn(async () => undefined),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return { from() { return { where() { return { limit: async () => [] }; } }; } };
    },
  }),
  schema: {},
}));

import { telegramSendMessage } from '../../api/telegram/lib';
import telegramWebhookRoute, { TELEGRAM_WEBHOOK_PROBE as routeProbe } from '../../api/telegram/webhook/route';

function webhookRequest(body: unknown, secret?: string): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (secret) headers.set('x-telegram-bot-api-secret-token', secret);
  return new Request(`http://test${TELEGRAM_WEBHOOK_PATH}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('telegramWebhookRoute helpers', () => {
  beforeEach(() => {
    __resetTelegramWebhookSpamForTests();
  });

  it('exports stable e2e probe contract', () => {
    expect(TELEGRAM_WEBHOOK_PROBE.path).toBe('/api/telegram/webhook');
    expect(routeProbe.spamLimit).toBe(12);
  });

  it('isTelegramWebhookConfigured requires token and secret', () => {
    expect(isTelegramWebhookConfigured('token', 'secret')).toBe(true);
    expect(isTelegramWebhookConfigured('', 'secret')).toBe(false);
  });

  it('extractTelegramMessageContext parses update', () => {
    expect(
      extractTelegramMessageContext({
        message: { message_id: 1, chat: { id: 99, type: 'private', username: 'tester' }, text: '/help' },
      }),
    ).toEqual({ chatId: 99, text: '/help', username: 'tester' });
  });

  it('allowTelegramChatCommand rate limits commands', () => {
    const chatId = 42;
    for (let i = 0; i < 12; i += 1) expect(allowTelegramChatCommand(chatId, 1_000)).toBe(true);
    expect(allowTelegramChatCommand(chatId, 1_000)).toBe(false);
  });

  it('validateTelegramWebhookSecret matches header', () => {
    const req = new Request('http://test', { headers: { 'x-telegram-bot-api-secret-token': 'sec' } });
    expect(validateTelegramWebhookSecret(req, 'sec')).toBe(true);
  });
});

describe('/api/telegram/webhook e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetTelegramWebhookSpamForTests();
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'webhook-secret';
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TELEGRAM_WEBHOOK_PATH);
    expect(src).toContain('api/telegram/webhook/route.js');
  });

  it('POST returns configured false when env missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await telegramWebhookRoute(webhookRequest({}));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { configured: boolean };
    expect(body.configured).toBe(false);
  });

  it('POST with invalid secret returns 403', async () => {
    const res = await telegramWebhookRoute(webhookRequest({ message: { chat: { id: 1 }, text: '/help' } }, 'wrong'));
    expect(res.status).toBe(403);
  });

  it('POST handles /help command', async () => {
    const res = await telegramWebhookRoute(
      webhookRequest(
        {
          message: {
            message_id: 1,
            chat: { id: 99, type: 'private' },
            text: '/help',
          },
        },
        'webhook-secret',
      ),
    );
    expect(res.status).toBe(200);
    expect(telegramSendMessage).toHaveBeenCalled();
  });
});