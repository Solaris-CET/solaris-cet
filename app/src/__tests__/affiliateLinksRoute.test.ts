// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AFFILIATE_LINKS_PATH, AFFILIATE_LINKS_PROBE } from '../../api/lib/affiliateLinks';

const linksMocks = vi.hoisted(() => {
  const schema = {
    affiliateLinks: { id: 'affiliateLinks.id', code: 'affiliateLinks.code', active: 'affiliateLinks.active', userId: 'affiliateLinks.userId' },
    affiliateClicksDaily: { affiliateLinkId: 'affiliateClicksDaily.affiliateLinkId', count: 'affiliateClicksDaily.count', day: 'affiliateClicksDaily.day' },
    referrals: { codeUsed: 'referrals.codeUsed', referrerUserId: 'referrals.referrerUserId' },
  };

  const bag = {
    authOk: true,
    links: [
      {
        id: 'link-1',
        code: 'CODE1',
        active: true,
        createdAt: new Date('2026-07-01T10:00:00Z'),
      },
    ],
    insertedCode: 'NEWCODE99',
    insertCalls: 0,
  };

  const getDb = () => ({
    select() {
      return {
        from(table: unknown) {
          if (table === schema.affiliateLinks) {
            return {
              where() {
                return {
                  limit: async () => bag.links,
                };
              },
            };
          }
          if (table === schema.affiliateClicksDaily || table === schema.referrals) {
            return {
              where() {
                return {
                  groupBy: async () => [],
                };
              },
            };
          }
          return { where: () => ({ limit: async () => [] }) };
        },
      };
    },
    insert(table: unknown) {
      return {
        values: async () => {
          if (table === schema.affiliateLinks) bag.insertCalls += 1;
        },
      };
    },
  });

  return Object.assign(bag, { schema, getDb });
});

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/authUser', () => ({
  requireUser: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!linksMocks.authOk || !auth.startsWith('Bearer valid-token')) return null;
    return { id: 'user-1', walletAddress: 'EQabc', role: 'user' };
  },
}));

vi.mock('../../api/gamification/lib/gamification', () => ({
  bootstrapGamification: async () => undefined,
  todayKeyUtc: () => '2026-07-07',
}));

vi.mock('nanoid', () => ({
  nanoid: () => 'newcode99',
}));

vi.mock('../../db/client', () => ({
  getDb: linksMocks.getDb,
  schema: linksMocks.schema,
}));

import affiliateLinksRoute, { AFFILIATE_LINKS_PROBE as routeProbe } from '../../api/gamification/affiliate/links/route';

function linksRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${AFFILIATE_LINKS_PATH}`, { ...init, headers });
}

describe('affiliateLinks helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(AFFILIATE_LINKS_PROBE.path).toBe('/api/gamification/affiliate/links');
    expect(routeProbe.authRequired).toBe(true);
    expect(routeProbe.listLimit).toBe(50);
  });
});

describe('/api/gamification/affiliate/links e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linksMocks.authOk = true;
    linksMocks.insertCalls = 0;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(AFFILIATE_LINKS_PATH);
    expect(src).toContain('api/gamification/affiliate/links/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await affiliateLinksRoute(linksRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET without auth returns 401', async () => {
    linksMocks.authOk = false;
    const res = await affiliateLinksRoute(linksRequest({ method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('GET returns affiliate links', async () => {
    const res = await affiliateLinksRoute(
      linksRequest({ method: 'GET', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; links: Array<{ code: string }> };
    expect(body.ok).toBe(true);
    expect(body.links).toHaveLength(1);
    expect(body.links[0]?.code).toBe('CODE1');
  });

  it('POST creates affiliate link', async () => {
    const res = await affiliateLinksRoute(
      linksRequest({ method: 'POST', headers: { Authorization: 'Bearer valid-token' } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; code: string };
    expect(body.ok).toBe(true);
    expect(body.code).toBe('NEWCODE99');
    expect(linksMocks.insertCalls).toBe(1);
  });
});