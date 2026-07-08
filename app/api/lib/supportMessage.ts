export const SUPPORT_MESSAGE_PATH = '/api/support/message';
export const SUPPORT_MESSAGE_METHODS = 'POST, OPTIONS';

export const SUPPORT_MESSAGE_PROBE = {
  path: SUPPORT_MESSAGE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  maxMessageLength: 2000,
  invalidJsonError: 'Invalid JSON' as const,
  missingConversationIdError: 'Missing conversationId' as const,
  invalidMessageError: 'Invalid message' as const,
  notFoundStatus: 404,
  notFoundError: 'Not found' as const,
  sender: 'user' as const,
};

export type ParsedSupportMessageBody = {
  conversationId: string;
  message: string;
};

export function parseSupportMessageBody(body: unknown): ParsedSupportMessageBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as { conversationId?: unknown; message?: unknown };
  const conversationId = typeof rec.conversationId === 'string' ? rec.conversationId.trim() : '';
  const message = typeof rec.message === 'string' ? rec.message.trim() : '';
  return { conversationId, message };
}

export function isValidSupportMessage(message: string): boolean {
  return Boolean(message) && message.length <= SUPPORT_MESSAGE_PROBE.maxMessageLength;
}