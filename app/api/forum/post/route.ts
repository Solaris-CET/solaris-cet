import { and, eq, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import { canModerateForumRole, canViewForumContent } from '@/api/lib/forumCommon';
import { FORUM_POST_PROBE, parseForumPostId } from '@/api/lib/forumPost';
import { jsonResponse, optionsResponse } from '@/api/lib/http';

export { FORUM_POST_PATH, FORUM_POST_PROBE } from '@/api/lib/forumPost';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, FORUM_POST_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'GET') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const postId = parseForumPostId(url.searchParams);
  if (!postId) return jsonResponse(req, { error: FORUM_POST_PROBE.missingIdError }, 400);

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

  if (!row) return jsonResponse(req, { error: FORUM_POST_PROBE.notFoundError }, 404);

  const ctx = await requireAuth(req);
  const isAuthed = !('error' in ctx);
  const canModerate = isAuthed && canModerateForumRole(ctx.user.role);
  const viewerId = isAuthed ? ctx.user.id : null;
  if (!canViewForumContent(row.status, viewerId, row.authorUserId, canModerate)) {
    return jsonResponse(req, { error: FORUM_POST_PROBE.notFoundError }, 404);
  }

  const [scoreRow] = await db
    .select({ score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score') })
    .from(schema.forumVotes)
    .where(and(eq(schema.forumVotes.targetType, FORUM_POST_PROBE.voteTargetType), eq(schema.forumVotes.targetId, postId)));

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
              eq(schema.forumVotes.targetType, FORUM_POST_PROBE.voteTargetType),
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