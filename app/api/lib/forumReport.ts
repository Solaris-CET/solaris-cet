export const FORUM_REPORT_PATH = '/api/forum/report';
export const FORUM_REPORT_METHODS = 'POST, OPTIONS';

export const FORUM_REPORT_TARGET_TYPES = ['post', 'comment'] as const;
export type ForumReportTargetType = (typeof FORUM_REPORT_TARGET_TYPES)[number];

export const FORUM_REPORT_PROBE = {
  path: FORUM_REPORT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  targetTypes: FORUM_REPORT_TARGET_TYPES,
  maxReasonLength: 120,
  maxDetailsLength: 800,
  invalidTargetTypeError: 'Invalid targetType' as const,
  invalidTargetIdError: 'Invalid targetId' as const,
  invalidReasonError: 'Invalid reason' as const,
  invalidDetailsError: 'Invalid details' as const,
  notFoundError: 'Not found' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export type ForumReportPostBody = {
  targetType: string;
  targetId: string;
  reason: string;
  details: string;
};

export function isForumReportTargetType(v: string): v is ForumReportTargetType {
  return (FORUM_REPORT_TARGET_TYPES as readonly string[]).includes(v);
}

export function parseForumReportPostBody(body: unknown): ForumReportPostBody {
  const targetTypeRaw =
    typeof body === 'object' && body !== null && 'targetType' in body && typeof (body as { targetType?: unknown }).targetType === 'string'
      ? (body as { targetType: string }).targetType.trim()
      : '';
  const targetId =
    typeof body === 'object' && body !== null && 'targetId' in body && typeof (body as { targetId?: unknown }).targetId === 'string'
      ? (body as { targetId: string }).targetId.trim()
      : '';
  const reason =
    typeof body === 'object' && body !== null && 'reason' in body && typeof (body as { reason?: unknown }).reason === 'string'
      ? (body as { reason: string }).reason.trim()
      : '';
  const details =
    typeof body === 'object' && body !== null && 'details' in body && typeof (body as { details?: unknown }).details === 'string'
      ? (body as { details: string }).details.trim()
      : '';
  return { targetType: targetTypeRaw, targetId, reason, details };
}

export function validateForumReportPostBody(body: ForumReportPostBody): { ok: true } | { ok: false; error: string; status: number } {
  if (!isForumReportTargetType(body.targetType)) {
    return { ok: false, error: FORUM_REPORT_PROBE.invalidTargetTypeError, status: 400 };
  }
  if (!body.targetId) return { ok: false, error: FORUM_REPORT_PROBE.invalidTargetIdError, status: 400 };
  if (!body.reason || body.reason.length > FORUM_REPORT_PROBE.maxReasonLength) {
    return { ok: false, error: FORUM_REPORT_PROBE.invalidReasonError, status: 400 };
  }
  if (body.details.length > FORUM_REPORT_PROBE.maxDetailsLength) {
    return { ok: false, error: FORUM_REPORT_PROBE.invalidDetailsError, status: 400 };
  }
  return { ok: true };
}