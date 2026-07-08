import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  FORUM_REPORT_PROBE,
  parseForumReportPostBody,
  validateForumReportPostBody,
} from '../../lib/forumReport';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { FORUM_REPORT_PATH, FORUM_REPORT_PROBE } from '@/api/lib/forumReport';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, FORUM_REPORT_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: FORUM_REPORT_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseForumReportPostBody(body);
  const validation = validateForumReportPostBody(parsed);
  if (!validation.ok) return jsonResponse(req, { error: validation.error }, validation.status);

  const db = getDb();
  if (parsed.targetType === 'post') {
    const [post] = await db.select({ id: schema.forumPosts.id }).from(schema.forumPosts).where(eq(schema.forumPosts.id, parsed.targetId));
    if (!post) return jsonResponse(req, { error: FORUM_REPORT_PROBE.notFoundError }, 404);
  } else {
    const [comment] = await db
      .select({ id: schema.forumComments.id })
      .from(schema.forumComments)
      .where(eq(schema.forumComments.id, parsed.targetId));
    if (!comment) return jsonResponse(req, { error: FORUM_REPORT_PROBE.notFoundError }, 404);
  }

  const [report] = await db
    .insert(schema.forumReports)
    .values({
      targetType: parsed.targetType,
      targetId: parsed.targetId,
      reporterUserId: ctx.user.id,
      reason: parsed.reason,
      details: parsed.details || null,
      createdAt: new Date(),
      resolvedAt: null,
      resolvedByUserId: null,
      resolution: null,
    })
    .returning();

  return jsonResponse(req, { ok: true, reportId: report.id });
}