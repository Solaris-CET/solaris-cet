export const FORUM_VOTE_PATH = '/api/forum/vote';
export const FORUM_VOTE_METHODS = 'POST, OPTIONS';

export const FORUM_VOTE_TARGET_TYPES = ['post', 'comment'] as const;
export type ForumVoteTargetType = (typeof FORUM_VOTE_TARGET_TYPES)[number];

export const FORUM_VOTE_PROBE = {
  path: FORUM_VOTE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  targetTypes: FORUM_VOTE_TARGET_TYPES,
  validValues: [-1, 0, 1] as const,
  invalidTargetTypeError: 'Invalid targetType' as const,
  invalidTargetIdError: 'Invalid targetId' as const,
  invalidVoteValueError: 'Invalid vote value' as const,
  notFoundError: 'Not found' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  likePoints: 1,
  dislikePoints: 0,
};

export type ForumVotePostBody = { targetType: string; targetId: string; value: number };

export function isForumVoteTargetType(v: string): v is ForumVoteTargetType {
  return (FORUM_VOTE_TARGET_TYPES as readonly string[]).includes(v);
}

export function parseForumVotePostBody(body: unknown): ForumVotePostBody {
  const targetTypeRaw =
    typeof body === 'object' && body !== null && 'targetType' in body && typeof (body as { targetType?: unknown }).targetType === 'string'
      ? (body as { targetType: string }).targetType.trim()
      : '';
  const targetId =
    typeof body === 'object' && body !== null && 'targetId' in body && typeof (body as { targetId?: unknown }).targetId === 'string'
      ? (body as { targetId: string }).targetId.trim()
      : '';
  const valueRaw =
    typeof body === 'object' && body !== null && 'value' in body && typeof (body as { value?: unknown }).value === 'number'
      ? (body as { value: number }).value
      : NaN;
  return { targetType: targetTypeRaw, targetId, value: valueRaw };
}

export function normalizeForumVoteValue(valueRaw: number): -1 | 0 | 1 | null {
  return valueRaw === 1 || valueRaw === -1 || valueRaw === 0 ? valueRaw : null;
}

export function validateForumVotePostBody(
  body: ForumVotePostBody,
): { ok: true; targetType: ForumVoteTargetType; targetId: string; value: -1 | 0 | 1 } | { ok: false; error: string; status: number } {
  if (!isForumVoteTargetType(body.targetType)) {
    return { ok: false, error: FORUM_VOTE_PROBE.invalidTargetTypeError, status: 400 };
  }
  if (!body.targetId) return { ok: false, error: FORUM_VOTE_PROBE.invalidTargetIdError, status: 400 };
  const value = normalizeForumVoteValue(body.value);
  if (value === null) return { ok: false, error: FORUM_VOTE_PROBE.invalidVoteValueError, status: 400 };
  return { ok: true, targetType: body.targetType, targetId: body.targetId, value };
}