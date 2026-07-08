import { asc, desc, eq, gte } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  asCommunityFeedDate,
  buildEventFeedItem,
  buildForumFeedItem,
  COMMUNITY_FEED_PROBE,
  parseCommunityFeedLimit,
  sortAndSerializeFeedItems,
  type CommunityFeedRawItem,
} from '../../lib/communityFeed';
import { jsonResponse, optionsResponse } from '@/api/lib/http';

export { COMMUNITY_FEED_PATH, COMMUNITY_FEED_PROBE } from '@/api/lib/communityFeed';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, COMMUNITY_FEED_PROBE.methods.join(', '));
  }
  if (req.method !== 'GET') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    const now = new Date();
    return jsonResponse(req, { now: now.toISOString(), items: [], leaderboard: [], degraded: true });
  }

  const url = new URL(req.url);
  const limit = parseCommunityFeedLimit(url.searchParams);
  const now = new Date();

  let degraded = false;
  const forum = await (async () => {
    try {
      return await db
        .select({
          id: schema.forumPosts.id,
          title: schema.forumPosts.title,
          at: schema.forumPosts.lastActivityAt,
        })
        .from(schema.forumPosts)
        .where(eq(schema.forumPosts.status, COMMUNITY_FEED_PROBE.visibleForumStatus))
        .orderBy(desc(schema.forumPosts.lastActivityAt))
        .limit(Math.min(COMMUNITY_FEED_PROBE.forumLimitCap, limit));
    } catch {
      degraded = true;
      return [];
    }
  })();

  const events = await (async () => {
    try {
      return await db
        .select({
          id: schema.events.id,
          slug: schema.events.slug,
          title: schema.events.title,
          at: schema.events.startAt,
        })
        .from(schema.events)
        .where(gte(schema.events.startAt, now))
        .orderBy(asc(schema.events.startAt))
        .limit(COMMUNITY_FEED_PROBE.eventsLimit);
    } catch {
      degraded = true;
      return [];
    }
  })();

  const leaderboard = await (async () => {
    try {
      return await db
        .select({
          userId: schema.users.id,
          walletAddress: schema.users.walletAddress,
          points: schema.users.points,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.points))
        .limit(COMMUNITY_FEED_PROBE.leaderboardLimit);
    } catch {
      degraded = true;
      return [];
    }
  })();

  const items = [
    ...forum
      .map((p): CommunityFeedRawItem | null => {
        const at = asCommunityFeedDate(p.at);
        if (!at) return null;
        return buildForumFeedItem(p.id, p.title, at);
      })
      .filter((v): v is CommunityFeedRawItem => v !== null),
    ...events
      .map((e): CommunityFeedRawItem | null => {
        const at = asCommunityFeedDate(e.at);
        if (!at) return null;
        return buildEventFeedItem(e.id, e.slug, e.title, at);
      })
      .filter((v): v is CommunityFeedRawItem => v !== null),
  ];

  return jsonResponse(req, {
    now: now.toISOString(),
    items: sortAndSerializeFeedItems(items, limit),
    leaderboard,
    degraded,
  });
}