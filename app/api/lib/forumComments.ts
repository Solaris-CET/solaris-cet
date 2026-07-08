import { parseForumIdParam } from './forumCommon';

export const FORUM_COMMENTS_PATH = '/api/forum/comments';
export const FORUM_COMMENTS_METHODS = 'GET, POST, OPTIONS';

export const FORUM_COMMENTS_PROBE = {
  path: FORUM_COMMENTS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequiredForPost: true,
  postIdParam: 'postId' as const,
  missingPostIdError: 'Missing postId' as const,
  notFoundError: 'Not found' as const,
  defaultSort: 'new' as const,
  topSort: 'top' as const,
  listLimit: 200,
  maxCommentLength: 2000,
  commentPoints: 2,
  voteTargetType: 'comment' as const,
  invalidCommentError: 'Invalid comment' as const,
  invalidParentError: 'Invalid parentCommentId' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export function parseForumCommentsPostId(searchParams: URLSearchParams): string {
  return parseForumIdParam(searchParams, FORUM_COMMENTS_PROBE.postIdParam);
}

export function parseForumCommentsSort(searchParams: URLSearchParams): string {
  return (searchParams.get('sort') ?? FORUM_COMMENTS_PROBE.defaultSort).trim();
}

export type ForumCommentPostBody = { body: string; parentCommentId: string };

export function parseForumCommentPostBody(body: unknown): ForumCommentPostBody {
  const text =
    typeof body === 'object' && body !== null && 'body' in body && typeof (body as { body?: unknown }).body === 'string'
      ? (body as { body: string }).body.trim()
      : '';
  const parentCommentId =
    typeof body === 'object' &&
    body !== null &&
    'parentCommentId' in body &&
    typeof (body as { parentCommentId?: unknown }).parentCommentId === 'string'
      ? (body as { parentCommentId: string }).parentCommentId.trim()
      : '';
  return { body: text, parentCommentId };
}

export function isValidForumCommentPost(body: ForumCommentPostBody): boolean {
  return Boolean(body.body) && body.body.length <= FORUM_COMMENTS_PROBE.maxCommentLength;
}