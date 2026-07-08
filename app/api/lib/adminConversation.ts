export const ADMIN_CONVERSATION_PATH = '/api/admin/conversation';
export const ADMIN_CONVERSATION_METHODS = 'GET, OPTIONS';

export const ADMIN_CONVERSATION_PROBE = {
  path: ADMIN_CONVERSATION_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Not found' as const,
};

export function parseAdminConversationId(searchParams: URLSearchParams): string {
  return String(searchParams.get('id') ?? '').trim();
}