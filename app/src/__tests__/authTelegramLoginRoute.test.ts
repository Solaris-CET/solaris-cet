// @vitest-environment node
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TELEGRAM_LOGIN_PATH, AUTH_TELEGRAM_LOGIN_PROBE } from '../../api/lib/authTelegramLogin';

const BOT_TOKEN = 'test-bot-token-12345';
const VALID_WALLET = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';

const loginMocks = vi.hoisted(() => ({
  identity: { userId: 'user-1', telegramUserId: '12345678', username: 'testuser' } as
    | { userId: string; telegramUserId: string; username: string }
    | null,
  user: {
    id: 'user-1',
    walletAddress: 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX',
  } as { id: string; walletAddress: string } | null,
}));

function makeTelegramPayload(botToken: string): Record<string, string> {
  const authDate = String(Math.floor(Date.now() / 1000));
  const base = {
    id: '12345678',
    first_name: 'Test',
    auth_date: authDate,
    username: 'testuser',
  };
  const dataCheckString = Object.entries(base)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return { ...base, hash };
}

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/jwt', () => ({
  getJwtSecretsFromEnv: () => ['secret'],
  signJwt: async () => 'signed-jwt',
}));

vi.mock('../../api/lib/clientIp', () => ({
  clientIp: () => '127.0.0.1',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                limit: async () => {
                  if (table && typeof table === 'object' && 'walletAddress' in table) {
                    return loginMocks.user ? [loginMocks.user] : [];
                  }
                  return loginMocks.identity ? [loginMocks.identity] : [];
                },
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          return {
            returning: async () => [{ id: 'sess-1' }],
          };
        },
      };
    },
  }),
  schema: {
    telegramLoginIdentities: { telegramUserId: 'telegramLoginIdentities.telegramUserId' },
    users: { id: 'users.id', walletAddress: 'users.walletAddress' },
    sessions: { id: 'sessions.id' },
  },
}));

import authTelegramLoginRoute, { AUTH_TELEGRAM_LOGIN_PROBE as routeProbe } from '../../api/auth/telegram/login/route';

function loginRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AUTH_TELEGRAM_LOGIN_PATH}`, { ...init, headers });
}

describe('authTelegramLogin helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AUTH_TELEGRAM_LOGIN_PROBE.path).toBe('/api/auth/telegram/login');
    expect(routeProbe.authRequired).toBe(false);
    expect(routeProbe.jwtTtlSeconds).toBe(60 * 60);
  });
});

describe('/api/auth/telegram/login e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMocks.identity = { userId: 'user-1', telegramUserId: '12345678', username: 'testuser' };
    loginMocks.user = { id: 'user-1', walletAddress: VALID_WALLET };
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AUTH_TELEGRAM_LOGIN_PATH);
    expect(src).toContain('api/auth/telegram/login/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await authTelegramLoginRoute(loginRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST returns 404 when telegram not linked', async () => {
    loginMocks.identity = null;
    const res = await authTelegramLoginRoute(
      loginRequest({ method: 'POST', body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)) }),
    );
    expect(res.status).toBe(404);
  });

  it('POST returns token when linked', async () => {
    const res = await authTelegramLoginRoute(
      loginRequest({ method: 'POST', body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; token: string };
    expect(body.ok).toBe(true);
    expect(body.token).toBe('signed-jwt');
  });

  it('POST without bot token returns 501', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await authTelegramLoginRoute(
      loginRequest({ method: 'POST', body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)) }),
    );
    expect(res.status).toBe(501);
  });
});