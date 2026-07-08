export const SUPPORT_MESSAGES_PATH = '/api/support/messages';
export const SUPPORT_MESSAGES_METHODS = 'GET, OPTIONS';

export const SUPPORT_MESSAGES_PROBE = {
  path: SUPPORT_MESSAGES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  emptyConversationId: null,
};

export type SupportMessageRow = {
  id: string;
  sender: string;
  body: string;
  createdAt: Date;
};

export function mapSupportMessageItem(message: SupportMessageRow) {
  return {
    id: message.id,
    sender: message.sender,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

export function buildSupportMessagesPayload(conversationId: string | null, messages: SupportMessageRow[]) {
  return {
    ok: true as const,
    conversationId,
    messages: messages.map(mapSupportMessageItem),
  };
}