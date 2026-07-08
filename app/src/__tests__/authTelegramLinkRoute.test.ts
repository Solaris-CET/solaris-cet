// @vitest-environment node
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TELEGRAM_LINK_PATH, AUTH_TELEGRAM_LINK_PROBE } from '../../api/lib/authTelegramLink';
import { verifyTelegramWidget } from '../../api/lib/telegramAuth';

const BOT_TOKEN = 'test-bot-token-12345';

const linkMocks = vi.hoisted(() => ({
  authOk: true,
  existingIdentity: null as { userId: string; telegramUserId: string } | null,
  inserted: false,
}));

function makeTelegramPayload(botToken: string, overrides: Record<string, string> = {}): Record<string, string> {
  const authDate = String(Math.floor(Date.now() / 1000));
  const base = {
    id: '12345678',
    first_name: 'Test',
    auth_date: authDate,
    username: 'testuser',
    ...overrides,
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

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async () => {
    if (!linkMocks.authOk) return { error: 'Unauthorized', status: 401 };
    return { user: { id: 'user-1', walletAddress: 'EQabc' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (linkMocks.existingIdentity ? [linkMocks.existingIdentity] : []),
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          linkMocks.inserted = true;
          return {
            onConflictDoUpdate: async () => undefined,
          };
        },
      };
    },
  }),
  schema: {
    telegramLoginIdentities: {
      telegramUserId: 'telegramLoginIdentities.telegramUserId',
      userId: 'telegramLoginIdentities.userId',
    },
  },
}));

import authTelegramLinkRoute, { AUTH_TELEGRAM_LINK_PROBE as routeProbe } from '../../api/auth/telegram/link/route';

function linkRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${AUTH_TELEGRAM_LINK_PATH}`, { ...init, headers });
}

describe('authTelegramLink helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AUTH_TELEGRAM_LINK_PROBE.path).toBe('/api/auth/telegram/link');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.methods).toEqual(['POST', 'OPTIONS']);
  });

  it('verifyTelegramWidget accepts valid widget payload', () => {
    const payload = makeTelegramPayload(BOT_TOKEN);
    const result = verifyTelegramWidget(payload, BOT_TOKEN);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.telegramUserId).toBe('12345678');
  });
});

describe('/api/auth/telegram/link e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkMocks.authOk = true;
    linkMocks.existingIdentity = null;
    linkMocks.inserted = false;
    process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AUTH_TELEGRAM_LINK_PATH);
    expect(src).toContain('api/auth/telegram/link/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await authTelegramLinkRoute(linkRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('GET returns 405', async () => {
    const res = await authTelegramLinkRoute(linkRequest({ method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('POST without auth returns 401', async () => {
    linkMocks.authOk = false;
    const res = await authTelegramLinkRoute(
      linkRequest({ method: 'POST', body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)) }),
    );
    expect(res.status).toBe(401);
  });

  it('POST links telegram identity when authenticated', async () => {
    const res = await authTelegramLinkRoute(
      linkRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    expect(linkMocks.inserted).toBe(true);
  });

  it('POST returns 409 when telegram id linked to another user', async () => {
    linkMocks.existingIdentity = { userId: 'other-user', telegramUserId: '12345678' };
    const res = await authTelegramLinkRoute(
      linkRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify(makeTelegramPayload(BOT_TOKEN)),
      }),
    );
    expect(res.status).toBe(409);
  });
});