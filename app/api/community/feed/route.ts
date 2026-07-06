import { asc, desc, eq, gte } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { jsonResponse, optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function parseLimit(req: Request, fallback: number): number {
  const url = new URL(req.url);
  const raw = url.searchParams.get('limit');
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(60, Math.floor(n)));
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (Number.isFinite(d.getTime())) return d;
  }
  return null;
}

type RawItem = { kind: 'forum_post' | 'event'; id: string; title: string; at: Date; href: string };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS');
  }
  if (req.method !== 'GET') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch {
    const now = new Date();
    return jsonResponse(req, { now: now.toISOString(), items: [], leaderboard: [], degraded: true });
  }
  const limit = parseLimit(req, 30);
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
        .where(eq(schema.forumPosts.status, 'visible'))
        .orderBy(desc(schema.forumPosts.lastActivityAt))
        .limit(Math.min(20, limit));
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
        .limit(8);
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
        .limit(8);
    } catch {
      degraded = true;
      return [];
    }
  })();

  const items = [
    ...forum
      .map((p): RawItem | null => {
        const at = asDate(p.at);
        if (!at) return null;
        return {
          kind: 'forum_post' as const,
          id: p.id,
          title: p.title,
          at,
          href: `/forum/${encodeURIComponent(p.id)}`,
        };
      })
      .filter((v): v is RawItem => v !== null),
    ...events
      .map((e): RawItem | null => {
        const at = asDate(e.at);
        if (!at) return null;
        return {
          kind: 'event' as const,
          id: e.id,
          title: e.title,
          at,
          href: `/evenimente/${encodeURIComponent(e.slug)}`,
        };
      })
      .filter((v): v is RawItem => v !== null),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map((i) => ({ ...i, at: i.at.toISOString() }));

  return jsonResponse(req, {
    now: now.toISOString(),
    items,
    leaderboard,
    degraded,
  });
}
