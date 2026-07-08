// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  COMMUNITY_SHARE_AI_PATH,
  COMMUNITY_SHARE_AI_PROBE,
  communityShareAiDedupeKey,
  parseCommunityShareAiContext,
} from '../../api/lib/communityShareAi';

const shareMocks = vi.hoisted(() => ({
  linked: true,
  awarded: true,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/rateLimit', () => ({
  withRateLimit: async () => null,
}));

vi.mock('../../api/telegram/initData', () => ({
  verifyTelegramInitData: () => ({ ok: true as const, authDate: 1_700_000_000, user: { id: 12345678 } }),
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => ({ awarded: shareMocks.awarded }),
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where() {
              return {
                limit: async () => (shareMocks.linked ? [{ userId: 'user-1', chatId: '12345678' }] : []),
              };
            },
          };
        },
      };
    },
  }),
  schema: {
    telegramLinks: { chatId: 'telegramLinks.chatId' },
  },
}));

import communityShareAiRoute, { COMMUNITY_SHARE_AI_PROBE as routeProbe } from '../../api/community/share-ai/route';

function shareRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  headers.set('X-Telegram-Init-Data', 'user=%7B%22id%22%3A12345678%7D&auth_date=1700000000&hash=abc');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${COMMUNITY_SHARE_AI_PATH}`, { ...init, headers });
}

describe('communityShareAi helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(COMMUNITY_SHARE_AI_PROBE.path).toBe('/api/community/share-ai');
    expect(routeProbe.sharePoints).toBe(5);
    expect(routeProbe.rateLimitKey).toBe('community-share-ai');
  });

  it('parseCommunityShareAiContext defaults and trims', () => {
    expect(parseCommunityShareAiContext({ context: ' hero ' })).toBe('hero');
    expect(parseCommunityShareAiContext({})).toBe('cet-ai');
    expect(communityShareAiDedupeKey('2026-07-07')).toBe('share-ai:2026-07-07');
  });
});

describe('/api/community/share-ai e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shareMocks.linked = true;
    shareMocks.awarded = true;
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(COMMUNITY_SHARE_AI_PATH);
    expect(src).toContain('api/community/share-ai/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await communityShareAiRoute(shareRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without init data returns 401', async () => {
    const headers = new Headers({ origin: 'https://allowed.test' });
    const res = await communityShareAiRoute(
      new Request(`http://test${COMMUNITY_SHARE_AI_PATH}`, { method: 'POST', headers }),
    );
    expect(res.status).toBe(401);
  });

  it('POST awards share points when linked', async () => {
    const res = await communityShareAiRoute(
      shareRequest({ method: 'POST', body: JSON.stringify({ context: 'cet-ai' }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; duplicated: boolean };
    expect(body.ok).toBe(true);
    expect(body.duplicated).toBe(false);
  });

  it('POST returns duplicated when points already awarded', async () => {
    shareMocks.awarded = false;
    const res = await communityShareAiRoute(
      shareRequest({ method: 'POST', body: JSON.stringify({ context: 'cet-ai' }) }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { duplicated: boolean };
    expect(body.duplicated).toBe(true);
  });

  it('POST returns not linked when telegram account missing', async () => {
    shareMocks.linked = false;
    const res = await communityShareAiRoute(
      shareRequest({ method: 'POST', body: JSON.stringify({ context: 'cet-ai' }) }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { notLinked: boolean };
    expect(body.notLinked).toBe(true);
  });
});