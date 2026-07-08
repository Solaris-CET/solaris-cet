export const ADMIN_CONVERSATION_RESOLVE_PATH = '/api/admin/conversation/resolve';
export const ADMIN_CONVERSATION_RESOLVE_METHODS = 'POST, OPTIONS';

export const ADMIN_CONVERSATION_RESOLVE_PROBE = {
  path: ADMIN_CONVERSATION_RESOLVE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-crm-resolve',
  resolvedStatus: 'resolved' as const,
  auditAction: 'CRM_CONVERSATION_RESOLVED' as const,
};

export type ConversationResolveBody =
  | { ok: true; conversationId: string }
  | { ok: false; error: 'Missing conversationId' };

export function parseConversationResolveBody(body: unknown): ConversationResolveBody {
  const conversationId =
    typeof (body as { conversationId?: unknown })?.conversationId === 'string'
      ? (body as { conversationId: string }).conversationId.trim()
      : '';
  if (!conversationId) return { ok: false, error: 'Missing conversationId' };
  return { ok: true, conversationId };
}