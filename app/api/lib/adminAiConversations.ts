export const ADMIN_AI_CONVERSATIONS_PATH = '/api/admin/ai/conversations';
export const ADMIN_AI_CONVERSATIONS_METHODS = 'GET, DELETE, OPTIONS';

export const ADMIN_AI_CONVERSATIONS_PROBE = {
  path: ADMIN_AI_CONVERSATIONS_PATH,
  methods: ['GET', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  getMinRole: 'viewer' as const,
  deleteMinRole: 'admin' as const,
  listLimit: 300,
};

export function parseDeleteConversationId(searchParams: URLSearchParams): string | null {
  const id = (searchParams.get('id') ?? '').trim();
  return id || null;
}