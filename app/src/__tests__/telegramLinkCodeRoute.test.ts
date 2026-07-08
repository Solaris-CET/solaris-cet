// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildTelegramLinkCodeExpiry,
  buildTelegramLinkCodeResponse,
  normalizeTelegramLinkCode,
  TELEGRAM_LINK_CODE_PATH,
  TELEGRAM_LINK_CODE_PROBE,
} from '../../api/lib/telegramLinkCode';

const linkMocks = vi.hoisted(() => ({
  authOk: true,
  insertedCode: '',
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!linkMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' },
      sid: 'sess-1',
      mfaEnabled: false,
    };
  },
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'abc123def4',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    delete() {
      return {
        where: async () => undefined,
      };
    },
    insert() {
      return {
        values(values: { code: string }) {
          linkMocks.insertedCode = values.code;
          return Promise.resolve();
        },
      };
    },
  }),
  schema: {
    telegramLinkCodes: { userId: 'telegramLinkCodes.userId' },
  },
}));

import telegramLinkCodeRoute, { TELEGRAM_LINK_CODE_PROBE as routeProbe } from '../../api/telegram/link-code/route';

function linkCodeRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${TELEGRAM_LINK_CODE_PATH}`, { method: 'POST', ...init, headers });
}

describe('telegramLinkCode helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(TELEGRAM_LINK_CODE_PROBE.path).toBe('/api/telegram/link-code');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.ttlMs).toBe(600_000);
  });

  it('normalizeTelegramLinkCode uppercases', () => {
    expect(normalizeTelegramLinkCode('abc123def4')).toBe('ABC123DEF4');
  });

  it('buildTelegramLinkCodeResponse shapes payload', () => {
    const expiresAt = buildTelegramLinkCodeExpiry(Date.parse('2026-07-07T12:00:00.000Z'));
    expect(buildTelegramLinkCodeResponse('CODE123', expiresAt)).toEqual({ code: 'CODE123', expiresAt });
  });
});

describe('/api/telegram/link-code e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkMocks.authOk = true;
    linkMocks.insertedCode = '';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(TELEGRAM_LINK_CODE_PATH);
    expect(src).toContain('api/telegram/link-code/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await telegramLinkCodeRoute(linkCodeRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    linkMocks.authOk = false;
    const res = await telegramLinkCodeRoute(linkCodeRequest());
    expect(res.status).toBe(401);
  });

  it('POST creates link code for authenticated user', async () => {
    const res = await telegramLinkCodeRoute(linkCodeRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { code: string; expiresAt: string };
    expect(body.code).toBe('ABC123DEF4');
    expect(body.expiresAt).toBeTruthy();
    expect(linkMocks.insertedCode).toBe('ABC123DEF4');
  });
});