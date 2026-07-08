// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  asCommunityFeedDate,
  buildEventFeedItem,
  buildForumFeedItem,
  COMMUNITY_FEED_PATH,
  COMMUNITY_FEED_PROBE,
  parseCommunityFeedLimit,
  sortAndSerializeFeedItems,
} from '../../api/lib/communityFeed';

const feedMocks = vi.hoisted(() => ({
  forum: [{ id: 'post-1', title: 'Forum topic', at: new Date('2026-07-07T12:00:00Z') }],
  events: [{ id: 'evt-1', slug: 'solar-day', title: 'Solar Day', at: new Date('2026-08-01T10:00:00Z') }],
  leaderboard: [{ userId: 'u1', walletAddress: 'EQabc', points: 100 }],
  throwDb: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => {
    if (feedMocks.throwDb) throw new Error('no db');
    return {
      select() {
        return {
          from(table: unknown) {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit: async () => {
                        if (table && typeof table === 'object' && 'points' in table) return feedMocks.leaderboard;
                        if (table && typeof table === 'object' && 'slug' in table) return feedMocks.events;
                        return feedMocks.forum;
                      },
                    };
                  },
                  limit: async () => feedMocks.forum,
                };
              },
              orderBy() {
                return {
                  limit: async () => {
                    if (table && typeof table === 'object' && 'points' in table) return feedMocks.leaderboard;
                    return feedMocks.events;
                  },
                };
              },
            };
          },
        };
      },
    };
  },
  schema: {
    forumPosts: { status: 'forumPosts.status', lastActivityAt: 'forumPosts.lastActivityAt' },
    events: { startAt: 'events.startAt', slug: 'events.slug' },
    users: { points: 'users.points', id: 'users.id', walletAddress: 'users.walletAddress' },
  },
}));

import communityFeedRoute, { COMMUNITY_FEED_PROBE as routeProbe } from '../../api/community/feed/route';

function feedRequest(query = '', init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${COMMUNITY_FEED_PATH}${query}`, { ...init, headers });
}

describe('communityFeed helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(COMMUNITY_FEED_PROBE.path).toBe('/api/community/feed');
    expect(routeProbe.defaultLimit).toBe(30);
    expect(routeProbe.methods).toEqual(['GET', 'OPTIONS']);
  });

  it('parseCommunityFeedLimit clamps values', () => {
    expect(parseCommunityFeedLimit(new URLSearchParams('limit=100'))).toBe(60);
    expect(parseCommunityFeedLimit(new URLSearchParams())).toBe(30);
  });

  it('buildForumFeedItem and sortAndSerializeFeedItems', () => {
    const at = asCommunityFeedDate('2026-07-07T12:00:00Z');
    expect(at).not.toBeNull();
    const forum = buildForumFeedItem('p1', 'Title', at!);
    const event = buildEventFeedItem('e1', 'slug', 'Event', new Date('2026-08-01T10:00:00Z'));
    const serialized = sortAndSerializeFeedItems([forum, event], 10);
    expect(serialized[0]?.kind).toBe('event');
    expect(serialized[0]?.at).toContain('2026-08-01');
  });
});

describe('/api/community/feed e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feedMocks.throwDb = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(COMMUNITY_FEED_PATH);
    expect(src).toContain('api/community/feed/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await communityFeedRoute(feedRequest('', { method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns feed items and leaderboard', async () => {
    const res = await communityFeedRoute(feedRequest('?limit=10', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ kind: string }>;
      leaderboard: Array<{ points: number }>;
      degraded: boolean;
    };
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.leaderboard).toHaveLength(1);
    expect(body.degraded).toBe(false);
  });

  it('GET returns degraded empty payload when db unavailable', async () => {
    feedMocks.throwDb = true;
    const res = await communityFeedRoute(feedRequest('', { method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { items: unknown[]; degraded: boolean };
    expect(body.items).toEqual([]);
    expect(body.degraded).toBe(true);
  });

  it('POST returns 405', async () => {
    const res = await communityFeedRoute(feedRequest('', { method: 'POST' }));
    expect(res.status).toBe(405);
  });
});