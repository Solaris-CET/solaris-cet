export const ADMIN_CONVERSATION_REPLY_PATH = '/api/admin/conversation/reply';
export const ADMIN_CONVERSATION_REPLY_METHODS = 'POST, OPTIONS';

export const ADMIN_CONVERSATION_REPLY_PROBE = {
  path: ADMIN_CONVERSATION_REPLY_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-crm-reply',
  maxMessageLength: 2000,
  auditAction: 'CRM_CONVERSATION_REPLIED' as const,
};

export type ConversationReplyBody =
  | { ok: true; conversationId: string; message: string }
  | { ok: false; error: 'Missing conversationId' | 'Invalid message' | 'Invalid JSON' };

export function parseConversationReplyBody(body: unknown): ConversationReplyBody {
  const conversationId =
    typeof (body as { conversationId?: unknown })?.conversationId === 'string'
      ? (body as { conversationId: string }).conversationId.trim()
      : '';
  const message =
    typeof (body as { message?: unknown })?.message === 'string'
      ? (body as { message: string }).message.trim()
      : '';
  if (!conversationId) return { ok: false, error: 'Missing conversationId' };
  if (!message || message.length > ADMIN_CONVERSATION_REPLY_PROBE.maxMessageLength) {
    return { ok: false, error: 'Invalid message' };
  }
  return { ok: true, conversationId, message };
}