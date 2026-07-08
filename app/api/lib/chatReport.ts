export const CHAT_REPORT_PATH = '/api/chat/report';
export const CHAT_REPORT_METHODS = 'POST, OPTIONS';

export const CHAT_REPORT_PROBE = {
  path: CHAT_REPORT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidReportError: 'Invalid report' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  maxReasonLength: 80,
  maxDetailsLength: 300,
};

export type ChatReportPostBody = { messageId: string; reason: string; details: string | null };

export function parseChatReportPostBody(body: unknown): ChatReportPostBody {
  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId?: unknown }).messageId === 'string'
      ? (body as { messageId: string }).messageId.trim()
      : '';
  const reason =
    typeof body === 'object' && body !== null && 'reason' in body && typeof (body as { reason?: unknown }).reason === 'string'
      ? (body as { reason: string }).reason.trim().slice(0, CHAT_REPORT_PROBE.maxReasonLength)
      : '';
  const details =
    typeof body === 'object' && body !== null && 'details' in body && typeof (body as { details?: unknown }).details === 'string'
      ? (body as { details: string }).details.trim().slice(0, CHAT_REPORT_PROBE.maxDetailsLength)
      : null;
  return { messageId, reason, details };
}

export function isValidChatReportPost(body: ChatReportPostBody): boolean {
  return Boolean(body.messageId && body.reason);
}