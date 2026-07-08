import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import {
  canSendCommunityDigestEmail,
  COMMUNITY_DIGEST_JOB_PROBE,
  communityDigestSiteOrigin,
  renderCommunityDigestEmail,
} from '../../lib/communityDigestJob';
import { getAllowedOrigin } from '@/api/lib/cors';
import { requireCron } from '@/api/lib/cron';
import { corsJson, corsOptions } from '@/api/lib/http';

export { COMMUNITY_DIGEST_JOB_PATH, COMMUNITY_DIGEST_JOB_PROBE } from '@/api/lib/communityDigestJob';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, COMMUNITY_DIGEST_JOB_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!requireCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }
  if (!canSendCommunityDigestEmail()) {
    return corsJson(req, COMMUNITY_DIGEST_JOB_PROBE.emailNotConfiguredStatus, { error: 'Email provider not configured' });
  }

  const db = getDb();
  const now = new Date();
  const since = new Date(now.getTime() - COMMUNITY_DIGEST_JOB_PROBE.lookbackDays * 24 * 60 * 60 * 1000);
  const weekFrom = since.toISOString().slice(0, 10);
  const weekTo = now.toISOString().slice(0, 10);

  const votesJoin = and(eq(schema.forumVotes.targetType, 'post'), eq(schema.forumVotes.targetId, schema.forumPosts.id));
  const topPosts = await db
    .select({
      id: schema.forumPosts.id,
      title: schema.forumPosts.title,
      score: sql<number>`coalesce(sum(${schema.forumVotes.value}), 0)`.as('score'),
    })
    .from(schema.forumPosts)
    .leftJoin(schema.forumVotes, votesJoin)
    .where(and(eq(schema.forumPosts.status, 'visible'), gte(schema.forumPosts.createdAt, since)))
    .groupBy(schema.forumPosts.id)
    .orderBy(desc(sql`coalesce(sum(${schema.forumVotes.value}), 0)`))
    .limit(COMMUNITY_DIGEST_JOB_PROBE.topPostsLimit);

  const subs = await db
    .select({
      email: schema.contacts.email,
      locale: schema.newsletterSubscriptions.locale,
    })
    .from(schema.newsletterSubscriptions)
    .innerJoin(schema.contacts, eq(schema.newsletterSubscriptions.contactId, schema.contacts.id))
    .where(eq(schema.newsletterSubscriptions.status, 'active'))
    .limit(COMMUNITY_DIGEST_JOB_PROBE.subscribersLimit);

  const originBase = communityDigestSiteOrigin();
  const posts = topPosts.map((p) => ({
    title: p.title,
    url: `${originBase}${COMMUNITY_DIGEST_JOB_PROBE.forumPath}/${encodeURIComponent(p.id)}`,
    score: p.score ?? 0,
  }));

  let queued = 0;
  for (const s of subs) {
    const to = (s.email ?? '').trim();
    if (!to) continue;
    const rendered = renderCommunityDigestEmail({
      locale: s.locale ?? 'ro',
      origin: originBase,
      weekFrom,
      weekTo,
      posts,
    });
    await db.insert(schema.emailOutbox).values({
      toEmail: to,
      template: COMMUNITY_DIGEST_JOB_PROBE.emailTemplate,
      subject: rendered.subject,
      html: rendered.html,
      textBody: rendered.text,
      payload: { weekFrom, weekTo, kind: 'forum' },
      status: 'pending',
      sendAfter: new Date(),
      sentAt: null,
      lastError: null,
      createdAt: new Date(),
    });
    queued += 1;
  }

  return corsJson(req, 200, { ok: true, queued, subscribers: subs.length, posts: posts.length });
}