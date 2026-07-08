// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildUserSettingsInsertValues,
  detectUserSettingsChanges,
  parseUserSettingsBody,
  USER_SETTINGS_PATH,
  USER_SETTINGS_PROBE,
} from '../../api/lib/userSettings';

const settingsMocks = vi.hoisted(() => ({
  authOk: true,
  hasExisting: false,
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
    if (!settingsMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => (settingsMocks.hasExisting ? [{ userId: 'user-1', email: 'a@b.com', telegramNotificationsEnabled: true, locale: 'ro', theme: 'dark', displayName: null, emailRemindersEnabled: false }] : []),
          };
        },
      };
    },
    update() {
      return { set: () => ({ where: async () => undefined }) };
    },
    insert() {
      return { values: async () => undefined };
    },
  }),
  schema: {
    userSettings: { userId: 'userSettings.userId' },
    telegramLinks: { userId: 'telegramLinks.userId' },
  },
}));

import userSettingsRoute, { USER_SETTINGS_PROBE as routeProbe } from '../../api/user/settings/route';

function settingsRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${USER_SETTINGS_PATH}`, { method: 'POST', ...init, headers, body: JSON.stringify(body) });
}

describe('userSettings helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(USER_SETTINGS_PROBE.path).toBe('/api/user/settings');
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseUserSettingsBody validates locale and theme', () => {
    const patch = parseUserSettingsBody({ locale: 'ro', theme: 'dark', displayName: 'Test' });
    expect(patch.locale).toBe('ro');
    expect(patch.theme).toBe('dark');
    expect(buildUserSettingsInsertValues('user-1', patch).locale).toBe('ro');
  });

  it('detectUserSettingsChanges tracks email updates', () => {
    const changes = detectUserSettingsChanges(
      { email: 'old@b.com', telegramNotificationsEnabled: true, locale: 'ro', theme: 'dark' },
      { displayName: null, email: 'new@b.com', emailRemindersEnabled: null, telegramNotificationsEnabled: null, locale: null, theme: null },
    );
    expect(changes.changedEmail).toBe(true);
  });
});

describe('/api/user/settings e2e probe', () => {
  beforeEach(() => {
    settingsMocks.authOk = true;
    settingsMocks.hasExisting = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(USER_SETTINGS_PATH);
    expect(src).toContain('api/user/settings/route.js');
  });

  it('POST without auth returns 401', async () => {
    settingsMocks.authOk = false;
    const res = await userSettingsRoute(settingsRequest({ locale: 'ro' }));
    expect(res.status).toBe(401);
  });

  it('POST saves settings for authenticated user', async () => {
    const res = await userSettingsRoute(settingsRequest({ locale: 'en', theme: 'light' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});