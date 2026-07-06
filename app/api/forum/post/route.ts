import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { jsonResponse, optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type, Authorization');
  }
  if (req.method !== 'GET') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const postId = (url.searchParams.get('id') ?? '').trim();
  if (!postId) return jsonResponse(req, { error: 'Missing id' }, 400);

  const db = getDb();

  const [row] = await db
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
    .where(eq(schema.forumPosts.id, postId))
    .limit(1);

  if (!row) return jsonResponse(req, { error: 'Not found' }, 404);

  const ctx = await requireAuth(req);
  const isAuthed = !('error' in ctx);
  const canModerate = isAuthed && (ctx.user.role === 'admin' || ctx.user.role === 'moderator');
  const viewerId = isAuthed ? ctx.user.id : null;
  const canView =
    row.status === 'visible' || (viewerId && (canModerate || viewerId === row.authorUserId));
  if (!canView) return jsonResponse(req, { error: 'Not found' }, 404);

  const [scoreRow] = await db
    .select({ score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score') })
    .from(schema.forumVotes)
    .where(and(eq(schema.forumVotes.targetType, 'post'), eq(schema.forumVotes.targetId, postId)));

  const [commentsRow] = await db
    .select({ comments: sql<number>`count(*)`.as('comments') })
    .from(schema.forumComments)
    .where(and(eq(schema.forumComments.postId, postId), eq(schema.forumComments.status, 'visible')));

  const viewerVote =
    viewerId
      ? await db
          .select({ value: schema.forumVotes.value })
          .from(schema.forumVotes)
          .where(
            and(
              eq(schema.forumVotes.userId, viewerId),
              eq(schema.forumVotes.targetType, 'post'),
              eq(schema.forumVotes.targetId, postId),
            ),
          )
          .limit(1)
      : [];

  return jsonResponse(req, {
    post: {
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastActivityAt: row.lastActivityAt,
      author: { userId: row.authorUserId, walletAddress: row.authorWalletAddress ?? null },
      status: canModerate || viewerId === row.authorUserId ? row.status : 'visible',
      score: scoreRow?.score ?? 0,
      comments: commentsRow?.comments ?? 0,
      viewerVote: viewerVote[0]?.value ?? 0,
      canModerate,
    },
  });
}

