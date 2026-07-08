export const AI_PINS_PATH = '/api/ai/pins';
export const AI_PINS_METHODS = 'GET, POST, DELETE, OPTIONS';

export const AI_PINS_PROBE = {
  path: AI_PINS_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  maxListRows: 200,
  maxNoteLength: 300,
  missingMessageIdError: 'messageId missing' as const,
  missingIdError: 'id missing' as const,
  notFoundError: 'Not found' as const,
};

export type PinPostBody =
  | { ok: true; messageId: string; note: string }
  | { ok: false; error: typeof AI_PINS_PROBE.missingMessageIdError };

export function parsePinPostBody(body: unknown): PinPostBody {
  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId: unknown }).messageId === 'string'
      ? (body as { messageId: string }).messageId.trim()
      : '';
  const note =
    typeof body === 'object' && body !== null && 'note' in body && typeof (body as { note: unknown }).note === 'string'
      ? (body as { note: string }).note.trim().slice(0, AI_PINS_PROBE.maxNoteLength)
      : '';
  if (!messageId) return { ok: false, error: AI_PINS_PROBE.missingMessageIdError };
  return { ok: true, messageId, note };
}

export function parsePinDeleteId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}