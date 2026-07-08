export const FORUM_POSTS_PATH = '/api/forum/posts';
export const FORUM_POSTS_METHODS = 'GET, POST, OPTIONS';

export const FORUM_POSTS_PROBE = {
  path: FORUM_POSTS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequiredForPost: true,
  defaultLimit: 20,
  minLimit: 1,
  maxLimit: 50,
  defaultSort: 'activity' as const,
  newSort: 'new' as const,
  minTitleLength: 3,
  maxTitleLength: 120,
  maxBodyLength: 4000,
  createPoints: 5,
  voteTargetType: 'post' as const,
  invalidTitleError: 'Invalid title' as const,
  invalidBodyError: 'Invalid body' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export function parseForumPostsLimit(searchParams: URLSearchParams, fallback = FORUM_POSTS_PROBE.defaultLimit): number {
  const raw = searchParams.get('limit');
  const n = raw ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(FORUM_POSTS_PROBE.minLimit, Math.min(FORUM_POSTS_PROBE.maxLimit, Math.floor(n)));
}

export function parseForumPostsSort(searchParams: URLSearchParams): string {
  return (searchParams.get('sort') ?? FORUM_POSTS_PROBE.defaultSort).trim();
}

export type ForumPostCreateBody = { title: string; body: string };

export function parseForumPostCreateBody(body: unknown): ForumPostCreateBody {
  const title =
    typeof body === 'object' && body !== null && 'title' in body && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title.trim()
      : '';
  const text =
    typeof body === 'object' && body !== null && 'body' in body && typeof (body as { body?: unknown }).body === 'string'
      ? (body as { body: string }).body.trim()
      : '';
  return { title, body: text };
}

export function isValidForumPostCreate(body: ForumPostCreateBody): boolean {
  return (
    body.title.length >= FORUM_POSTS_PROBE.minTitleLength &&
    body.title.length <= FORUM_POSTS_PROBE.maxTitleLength &&
    Boolean(body.body) &&
    body.body.length <= FORUM_POSTS_PROBE.maxBodyLength
  );
}