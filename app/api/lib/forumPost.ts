import { parseForumIdParam } from './forumCommon';

export const FORUM_POST_PATH = '/api/forum/post';
export const FORUM_POST_METHODS = 'GET, OPTIONS';

export const FORUM_POST_PROBE = {
  path: FORUM_POST_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  idParam: 'id' as const,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Not found' as const,
  voteTargetType: 'post' as const,
};

export function parseForumPostId(searchParams: URLSearchParams): string {
  return parseForumIdParam(searchParams, FORUM_POST_PROBE.idParam);
}