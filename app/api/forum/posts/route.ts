import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';
import { ensureAllowedOrigin } from '../../lib/originGuard';
import { awardPoints } from '../../lib/points';

export const config = { runtime: 'nodejs' };

function parseLimit(req: Request, fallback: number): number {
  const url = new URL(req.url);
  const raw = url.searchParams.get('limit');
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, POST, OPTIONS', 'Content-Type, Authorization');
  }

  const db = getDb();

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const sort = (url.searchParams.get('sort') ?? 'activity').trim();
    const limit = parseLimit(req, 20);

    const ctx = await requireAuth(req);
    const isAuthed = !('error' in ctx);
    const viewerId = isAuthed ? ctx.user.id : null;

    const orderBy =
      sort === 'new' ? desc(schema.forumPosts.createdAt) : desc(schema.forumPosts.lastActivityAt);

    const rows = await db
      .select({
        id: schema.forumPosts.id,
        authorUserId: schema.forumPosts.authorUserId,
        title: schema.forumPosts.title,
        body: schema.forumPosts.body,
        status: schema.forumPosts.status,
        createdAt: schema.forumPosts.createdAt,
        updatedAt: schema.forumPosts.updatedAt,
        lastActivityAt: schema.forumPosts.lastActivityAt,
        authorWalletAddress: schema.users.walletAddress,
      })
      .from(schema.forumPosts)
      .leftJoin(schema.users, eq(schema.forumPosts.authorUserId, schema.users.id))
      .where(eq(schema.forumPosts.status, 'visible'))
      .orderBy(orderBy)
      .limit(limit);

    const ids = rows.map((r) => r.id);
    const scores =
      ids.length > 0
        ? await db
            .select({
              targetId: schema.forumVotes.targetId,
              score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score'),
            })
            .from(schema.forumVotes)
            .where(and(eq(schema.forumVotes.targetType, 'post'), inArray(schema.forumVotes.targetId, ids)))
            .groupBy(schema.forumVotes.targetId)
        : [];
    const commentCounts =
      ids.length > 0
        ? await db
            .select({
              postId: schema.forumComments.postId,
              comments: sql<number>`count(*)`.as('comments'),
            })
            .from(schema.forumComments)
            .where(and(eq(schema.forumComments.status, 'visible'), inArray(schema.forumComments.postId, ids)))
            .groupBy(schema.forumComments.postId)
        : [];
    const viewerVotes =
      viewerId && ids.length > 0
        ? await db
            .select({
              targetId: schema.forumVotes.targetId,
              value: schema.forumVotes.value,
            })
            .from(schema.forumVotes)
            .where(
              and(
                eq(schema.forumVotes.userId, viewerId),
                eq(schema.forumVotes.targetType, 'post'),
                inArray(schema.forumVotes.targetId, ids),
              ),
            )
        : [];

    const scoreById = new Map(scores.map((r) => [r.targetId, r.score]));
    const commentsById = new Map(commentCounts.map((r) => [r.postId, r.comments]));
    const viewerVoteById = new Map(viewerVotes.map((r) => [r.targetId, r.value]));

    return jsonResponse(req, {
      posts: rows.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        lastActivityAt: p.lastActivityAt,
        author: { userId: p.authorUserId, walletAddress: p.authorWalletAddress ?? null },
        score: scoreById.get(p.id) ?? 0,
        comments: commentsById.get(p.id) ?? 0,
        viewerVote: viewerId ? viewerVoteById.get(p.id) ?? 0 : 0,
      })),
    });
  }

  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const title =
    typeof body === 'object' && body !== null && 'title' in body && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title.trim()
      : '';
  const text =
    typeof body === 'object' && body !== null && 'body' in body && typeof (body as { body?: unknown }).body === 'string'
      ? (body as { body: string }).body.trim()
      : '';

  if (title.length < 3 || title.length > 120) return jsonResponse(req, { error: 'Invalid title' }, 400);
  if (!text || text.length > 4000) return jsonResponse(req, { error: 'Invalid body' }, 400);

  const [post] = await db
    .insert(schema.forumPosts)
    .values({
      authorUserId: ctx.user.id,
      title,
      body: text,
      status: 'visible',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    })
    .returning();

  await awardPoints(db, ctx.user.id, 5, 'forum_post', { dedupeKey: `forum_post:${post.id}` });
  return jsonResponse(req, { ok: true, postId: post.id });
}

