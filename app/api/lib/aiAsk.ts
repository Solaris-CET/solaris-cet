import { CET_AI_MAX_QUERY_CHARS } from '@/lib/cetAiConstants';

export const AI_ASK_PATH = '/api/ai/ask';
export const AI_ASK_METHODS = 'POST, OPTIONS';

export const AI_ASK_PROBE = {
  path: AI_ASK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'cet-ai-ask' as const,
  rateLimit: 20,
  rateWindowSeconds: 10,
  maxQueryChars: CET_AI_MAX_QUERY_CHARS,
  maxConversationTurns: 24,
  maxInstructionsChars: 1200,
  maxAttachmentIds: 6,
  minAttachmentIdLength: 10,
  missingQueryMessage: 'Query parameter is missing.' as const,
  noProviderMessage:
    'No AI provider API key configured. Set GROK_API_KEY_ENC/GROK_API_KEY, GEMINI_API_KEY_ENC/GEMINI_API_KEY, or ANTHROPIC_API_KEY_ENC/ANTHROPIC_API_KEY in the server environment.' as const,
};

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

export function safeTrimText(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : t.slice(0, max);
}

export function normalizeConversation(raw: unknown): ConversationTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ConversationTurn[] = [];
  for (const item of raw) {
    if (out.length >= AI_ASK_PROBE.maxConversationTurns) break;
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const c = content.trim();
    if (!c) continue;
    out.push({ role, content: c.slice(0, AI_ASK_PROBE.maxQueryChars) });
  }
  return out;
}

export type AskQueryParse =
  | { ok: true; query: string }
  | { ok: false; message: string; status: 400 };

export function parseAskQuery(body: unknown): AskQueryParse {
  const rawQuery =
    typeof body === 'object' &&
    body !== null &&
    'query' in body &&
    typeof (body as { query: unknown }).query === 'string'
      ? (body as { query: string }).query
      : '';
  const trimmedQuery = rawQuery.trim();
  if (!trimmedQuery) return { ok: false, message: AI_ASK_PROBE.missingQueryMessage, status: 400 };
  if (trimmedQuery.length > AI_ASK_PROBE.maxQueryChars) {
    return {
      ok: false,
      message: `Query must be at most ${AI_ASK_PROBE.maxQueryChars} characters.`,
      status: 400,
    };
  }
  return { ok: true, query: trimmedQuery };
}

export function parseAskModelPreference(body: unknown): 'auto' | 'grok' | 'gemini' | 'claude' {
  const raw =
    typeof body === 'object' && body !== null && 'model' in body && typeof (body as { model: unknown }).model === 'string'
      ? (body as { model: string }).model
      : 'auto';
  return raw === 'grok' || raw === 'gemini' || raw === 'claude' ? raw : 'auto';
}

export function parseAskTone(body: unknown): 'brand' | 'neutral' | 'fun' {
  const raw =
    typeof body === 'object' && body !== null && 'tone' in body && typeof (body as { tone: unknown }).tone === 'string'
      ? (body as { tone: string }).tone
      : 'brand';
  return raw === 'neutral' || raw === 'fun' ? raw : 'brand';
}

export function parseAskMode(body: unknown): 'default' | 'eli5' | 'read' {
  const raw =
    typeof body === 'object' && body !== null && 'mode' in body && typeof (body as { mode: unknown }).mode === 'string'
      ? (body as { mode: string }).mode
      : 'default';
  return raw === 'eli5' || raw === 'read' ? raw : 'default';
}

export function parseAskConversationId(body: unknown): string | null {
  const raw =
    typeof body === 'object' && body !== null && 'conversationId' in body && typeof (body as { conversationId: unknown }).conversationId === 'string'
      ? (body as { conversationId: string }).conversationId.trim()
      : '';
  return raw ? raw.slice(0, 80) : null;
}

export function parseAskRevisionOfMessageId(body: unknown): string | null {
  const raw =
    typeof body === 'object' &&
    body !== null &&
    'revisionOfMessageId' in body &&
    typeof (body as { revisionOfMessageId: unknown }).revisionOfMessageId === 'string'
      ? (body as { revisionOfMessageId: string }).revisionOfMessageId.trim()
      : '';
  return raw ? raw.slice(0, 80) : null;
}

export function parseAskInstructions(body: unknown): string {
  const raw =
    typeof body === 'object' &&
    body !== null &&
    'instructions' in body &&
    typeof (body as { instructions: unknown }).instructions === 'string'
      ? (body as { instructions: string }).instructions
      : '';
  return safeTrimText(raw, AI_ASK_PROBE.maxInstructionsChars);
}

export function parseAskAttachmentIds(body: unknown): string[] {
  const raw =
    typeof body === 'object' && body !== null && 'attachmentIds' in body
      ? (body as { attachmentIds: unknown }).attachmentIds
      : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim().slice(0, 80))
    .filter((s) => s.length >= AI_ASK_PROBE.minAttachmentIdLength)
    .slice(0, AI_ASK_PROBE.maxAttachmentIds);
}

export function parseAskForceFresh(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'forceFresh' in body &&
    typeof (body as { forceFresh: unknown }).forceFresh === 'boolean' &&
    (body as { forceFresh: boolean }).forceFresh
  );
}