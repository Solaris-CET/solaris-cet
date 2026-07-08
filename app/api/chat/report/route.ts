import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  CHAT_REPORT_PROBE,
  isValidChatReportPost,
  parseChatReportPostBody,
} from '../../lib/chatReport';
import { jsonResponse, optionsResponse } from '@/api/lib/http';
import { ensureAllowedOrigin } from '@/api/lib/originGuard';

export { CHAT_REPORT_PATH, CHAT_REPORT_PROBE } from '@/api/lib/chatReport';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const guard = ensureAllowedOrigin(req);
  if (guard instanceof Response) return guard;

  if (req.method === 'OPTIONS') {
    return optionsResponse(req, CHAT_REPORT_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const ctx = await requireAuth(req);
  if ('error' in ctx) return jsonResponse(req, { error: ctx.error }, ctx.status);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { error: CHAT_REPORT_PROBE.invalidJsonError }, 400);
  }

  const parsed = parseChatReportPostBody(body);
  if (!isValidChatReportPost(parsed)) return jsonResponse(req, { error: CHAT_REPORT_PROBE.invalidReportError }, 400);

  const db = getDb();
  await db
    .insert(schema.chatReports)
    .values({ messageId: parsed.messageId, reporterUserId: ctx.user.id, reason: parsed.reason, details: parsed.details });
  return jsonResponse(req, { ok: true });
}