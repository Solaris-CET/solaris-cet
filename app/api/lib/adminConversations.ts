export const ADMIN_CONVERSATIONS_PATH = '/api/admin/conversations';
export const ADMIN_CONVERSATIONS_METHODS = 'GET, OPTIONS';

export const ADMIN_CONVERSATIONS_STATUSES = ['open', 'resolved'] as const;
export type CrmConversationStatus = (typeof ADMIN_CONVERSATIONS_STATUSES)[number];

export const ADMIN_CONVERSATIONS_PROBE = {
  path: ADMIN_CONVERSATIONS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  maxListRows: 200,
  maxRelatedRows: 500,
};

export function parseConversationsStatusFilter(searchParams: URLSearchParams): readonly CrmConversationStatus[] {
  const statusParam = String(searchParams.get('status') ?? '').trim();
  if (statusParam === 'resolved') return ['resolved'];
  if (statusParam === 'open') return ['open'];
  return ADMIN_CONVERSATIONS_STATUSES;
}