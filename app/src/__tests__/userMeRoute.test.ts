// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildUserMePayload,
  normalizeReferralsCount,
  USER_ME_PATH,
  USER_ME_PROBE,
} from '../../api/lib/userMe';

const meMocks = vi.hoisted(() => {
  const schema = {
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
    referrals: { referrerUserId: 'referrals.referrerUserId' },
  };

  const bag = {
    authOk: true,
    settings: {
      displayName: 'Solaris User',
      email: 'user@example.com',
      emailRemindersEnabled: true,
      telegramNotificationsEnabled: false,
      locale: 'ro',
      theme: 'dark',
    },
    telegram: { username: 'solaris_user', chatId: '12345' },
    referralsCount: 2,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              if (table === schema.userSettings) {
                return Promise.resolve([bag.settings]);
              }
              if (table === schema.telegramLinks) {
                return Promise.resolve([bag.telegram]);
              }
              if (table === schema.referrals) {
                return Promise.resolve([{ c: bag.referralsCount }]);
              }
              return Promise.resolve([]);
            },
          };
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!meMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: {
        id: 'user-1',
        walletAddress: 'EQabc',
        role: 'user',
        points: 120,
        referralCode: 'REF123',
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
      sid: 'sess-1',
      mfaEnabled: true,
    };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: meMocks.getDb,
  schema: meMocks.schema,
}));

import userMeRoute, { USER_ME_PROBE as routeProbe } from '../../api/me/route';

function meRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('Authorization', 'Bearer valid-token');
  return new Request(`http://test${USER_ME_PATH}`, { ...init, headers });
}

describe('userMe helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_ME_PROBE.path).toBe('/api/me');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.defaultLocale).toBe('ro');
  });

  it('buildUserMePayload shapes response', () => {
    const payload = buildUserMePayload({
      ctx: {
        user: {
          id: 'user-1',
          walletAddress: 'EQabc',
          role: 'user',
          points: 120,
          referralCode: 'REF123',
          createdAt: new Date('2026-01-15T00:00:00Z'),
        },
        mfaEnabled: true,
      },
      settings: {
        displayName: 'Solaris User',
        email: 'user@example.com',
        emailRemindersEnabled: true,
        telegramNotificationsEnabled: false,
        locale: 'ro',
        theme: 'dark',
      },
      telegram: { linked: true, username: 'solaris_user', chatId: '12345' },
      referralsCount: 2,
    });
    expect(payload.user.referralCode).toBe('REF123');
    expect(payload.settings.displayName).toBe('Solaris User');
    expect(payload.stats.referralsCount).toBe(2);
    expect(payload.stats.mfaEnabled).toBe(true);
  });

  it('normalizeReferralsCount coerces count', () => {
    expect(normalizeReferralsCount(3)).toBe(3);
    expect(normalizeReferralsCount(undefined)).toBe(0);
  });
});

describe('/api/me e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    meMocks.authOk = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_ME_PATH);
    expect(src).toContain('api/me/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await userMeRoute(meRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    meMocks.authOk = false;
    const res = await userMeRoute(meRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns user profile bundle', async () => {
    const res = await userMeRoute(meRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { referralCode: string };
      settings: { displayName: string };
      telegram: { linked: boolean };
      stats: { referralsCount: number; mfaEnabled: boolean };
    };
    expect(body.user.referralCode).toBe('REF123');
    expect(body.settings.displayName).toBe('Solaris User');
    expect(body.telegram.linked).toBe(true);
    expect(body.stats.referralsCount).toBe(2);
    expect(body.stats.mfaEnabled).toBe(true);
  });
});