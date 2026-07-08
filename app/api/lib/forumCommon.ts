export const FORUM_MODERATOR_ROLES = ['admin', 'moderator'] as const;
export const FORUM_VISIBLE_STATUS = 'visible' as const;

export function canModerateForumRole(role: string): boolean {
  return (FORUM_MODERATOR_ROLES as readonly string[]).includes(role);
}

export function canViewForumContent(
  status: string,
  viewerId: string | null,
  authorUserId: string,
  canModerate: boolean,
): boolean {
  return status === FORUM_VISIBLE_STATUS || Boolean(viewerId && (canModerate || viewerId === authorUserId));
}

export function parseForumIdParam(searchParams: URLSearchParams, key: string): string {
  return (searchParams.get(key) ?? '').trim();
}