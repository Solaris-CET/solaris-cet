// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildSocialShareDedupeKey,
  parseSocialShareBody,
  SOCIAL_SHARE_PATH,
  SOCIAL_SHARE_PROBE,
  socialShareDayKey,
} from '../../api/lib/socialShare';

const shareMocks = vi.hoisted(() => ({
  authOk: true,
  insertFails: false,
  awarded: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/originGuard', () => ({
  ensureAllowedOrigin: () => null,
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!shareMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return {
      user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' },
      sid: 'sess-1',
      mfaEnabled: false,
    };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => ({ awarded: shareMocks.awarded }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    insert() {
      return {
        values: async () => {
          if (shareMocks.insertFails) throw new Error('duplicate');
        },
      };
    },
  }),
  schema: {
    shareEvents: { userId: 'shareEvents.userId' },
  },
}));

import socialShareRoute, { SOCIAL_SHARE_PROBE as routeProbe } from '../../api/social/share/route';

function shareRequest(body: unknown, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer valid-token');
  headers.set('origin', 'https://allowed.test');
  headers.set('Content-Type', 'application/json');
  return new Request(`http://test${SOCIAL_SHARE_PATH}`, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

describe('socialShare helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(SOCIAL_SHARE_PROBE.path).toBe('/api/social/share');
    expect(routeProbe.sharePoints).toBe(2);
    expect(routeProbe.rateLimitKey).toBe('share');
  });

  it('parseSocialShareBody trims and validates', () => {
    expect(parseSocialShareBody({ platform: ' twitter ', url: ' https://x.test ' })).toEqual({
      platform: 'twitter',
      url: 'https://x.test',
    });
    expect(parseSocialShareBody({ platform: '', url: 'https://x.test' })).toBeNull();
  });

  it('buildSocialShareDedupeKey includes day platform and url', () => {
    expect(buildSocialShareDedupeKey('2026-07-07', 'twitter', 'https://x.test')).toBe(
      'share:2026-07-07:twitter:https://x.test',
    );
    expect(socialShareDayKey(new Date('2026-07-07T15:00:00.000Z'))).toBe('2026-07-07');
  });
});

describe('/api/social/share e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shareMocks.authOk = true;
    shareMocks.insertFails = false;
    shareMocks.awarded = true;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(SOCIAL_SHARE_PATH);
    expect(src).toContain('api/social/share/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await socialShareRoute(
      new Request(`http://test${SOCIAL_SHARE_PATH}`, {
        method: 'OPTIONS',
        headers: { origin: 'https://allowed.test' },
      }),
    );
    expect(res.status).toBe(204);
  });

  it('POST awards share points', async () => {
    const res = await socialShareRoute(shareRequest({ platform: 'twitter', url: 'https://x.test/post' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; awarded: boolean };
    expect(body.ok).toBe(true);
    expect(body.awarded).toBe(true);
  });

  it('POST duplicate share returns awarded false', async () => {
    shareMocks.insertFails = true;
    const res = await socialShareRoute(shareRequest({ platform: 'twitter', url: 'https://x.test/post' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; awarded: boolean };
    expect(body.ok).toBe(true);
    expect(body.awarded).toBe(false);
  });

  it('POST invalid body returns 400', async () => {
    const res = await socialShareRoute(shareRequest({ platform: 'twitter' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe(SOCIAL_SHARE_PROBE.invalidRequestError);
  });
});