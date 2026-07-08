export const COMMUNITY_FEED_PATH = '/api/community/feed';
export const COMMUNITY_FEED_METHODS = 'GET, OPTIONS';

export const COMMUNITY_FEED_PROBE = {
  path: COMMUNITY_FEED_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  defaultLimit: 30,
  minLimit: 1,
  maxLimit: 60,
  forumLimitCap: 20,
  eventsLimit: 8,
  leaderboardLimit: 8,
  visibleForumStatus: 'visible' as const,
};

export type CommunityFeedItemKind = 'forum_post' | 'event';

export type CommunityFeedRawItem = {
  kind: CommunityFeedItemKind;
  id: string;
  title: string;
  at: Date;
  href: string;
};

export function parseCommunityFeedLimit(searchParams: URLSearchParams, fallback = COMMUNITY_FEED_PROBE.defaultLimit): number {
  const raw = searchParams.get('limit');
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(COMMUNITY_FEED_PROBE.minLimit, Math.min(COMMUNITY_FEED_PROBE.maxLimit, Math.floor(n)));
}

export function asCommunityFeedDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d;
  }
  return null;
}

export function buildForumFeedItem(id: string, title: string, at: Date): CommunityFeedRawItem {
  return {
    kind: 'forum_post',
    id,
    title,
    at,
    href: `/forum/${encodeURIComponent(id)}`,
  };
}

export function buildEventFeedItem(id: string, slug: string, title: string, at: Date): CommunityFeedRawItem {
  return {
    kind: 'event',
    id,
    title,
    at,
    href: `/evenimente/${encodeURIComponent(slug)}`,
  };
}

export function sortAndSerializeFeedItems(items: CommunityFeedRawItem[], limit: number) {
  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map((i) => ({ ...i, at: i.at.toISOString() }));
}