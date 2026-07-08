export const AI_REPORT_PATH = '/api/ai/report';
export const AI_REPORT_METHODS = 'POST, OPTIONS';

export const AI_REPORT_PROBE = {
  path: AI_REPORT_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'cet-ai-report' as const,
  rateLimit: 10,
  rateWindowSeconds: 30,
  maxReasonLength: 120,
  maxDetailsLength: 1200,
  maxMessageIdLength: 80,
  maxQueryLength: 500,
  maxResponseLength: 2000,
  missingReasonError: 'reason missing' as const,
};

export type ReportBodyParse =
  | { ok: true; reason: string; details: string; messageId: string; query: string; response: string }
  | { ok: false; error: typeof AI_REPORT_PROBE.missingReasonError };

function trimField(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function parseReportBody(body: unknown): ReportBodyParse {
  const reason = trimField(
    typeof body === 'object' && body !== null && 'reason' in body ? (body as { reason: unknown }).reason : null,
    AI_REPORT_PROBE.maxReasonLength,
  );
  if (!reason) return { ok: false, error: AI_REPORT_PROBE.missingReasonError };
  return {
    ok: true,
    reason,
    details: trimField(
      typeof body === 'object' && body !== null && 'details' in body ? (body as { details: unknown }).details : null,
      AI_REPORT_PROBE.maxDetailsLength,
    ),
    messageId: trimField(
      typeof body === 'object' && body !== null && 'messageId' in body ? (body as { messageId: unknown }).messageId : null,
      AI_REPORT_PROBE.maxMessageIdLength,
    ),
    query: trimField(
      typeof body === 'object' && body !== null && 'query' in body ? (body as { query: unknown }).query : null,
      AI_REPORT_PROBE.maxQueryLength,
    ),
    response: trimField(
      typeof body === 'object' && body !== null && 'response' in body ? (body as { response: unknown }).response : null,
      AI_REPORT_PROBE.maxResponseLength,
    ),
  };
}