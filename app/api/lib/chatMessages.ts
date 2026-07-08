export const CHAT_MESSAGES_PATH = '/api/chat/messages';
export const CHAT_MESSAGES_METHODS = 'GET, POST, OPTIONS';

export const CHAT_MESSAGES_PROBE = {
  path: CHAT_MESSAGES_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequiredForPost: true,
  unauthenticatedStatus: 401,
  missingRoomIdError: 'Missing roomId' as const,
  invalidMessageError: 'Invalid message' as const,
  invalidJsonError: 'Invalid JSON body' as const,
  maxMessageLength: 500,
  listLimit: 80,
  defaultBannedWords: ['scam', 'airdrop', 'seed phrase'] as const,
  maxBannedWords: 200,
  moderatorRoles: ['admin', 'moderator'] as const,
  chatPoints: 1,
};

export function parseChatBannedWordsEnv(): string[] {
  const raw = String(process.env.CHAT_BANNED_WORDS ?? '').trim();
  if (!raw) return [...CHAT_MESSAGES_PROBE.defaultBannedWords];
  return raw
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, CHAT_MESSAGES_PROBE.maxBannedWords);
}

export function chatMessageHasBannedWord(text: string, bannedWords = parseChatBannedWordsEnv()): boolean {
  const t = text.toLowerCase();
  return bannedWords.some((w) => w && t.includes(w));
}

export function canModerateChat(role: string): boolean {
  return (CHAT_MESSAGES_PROBE.moderatorRoles as readonly string[]).includes(role);
}

export type ChatMessagePostBody = { roomId: string; body: string };

export function parseChatMessagePostBody(body: unknown): ChatMessagePostBody {
  const roomId =
    typeof body === 'object' && body !== null && 'roomId' in body && typeof (body as { roomId?: unknown }).roomId === 'string'
      ? (body as { roomId: string }).roomId.trim()
      : '';
  const text =
    typeof body === 'object' && body !== null && 'body' in body && typeof (body as { body?: unknown }).body === 'string'
      ? (body as { body: string }).body.trim()
      : '';
  return { roomId, body: text };
}

export function isValidChatMessagePost(body: ChatMessagePostBody): boolean {
  return Boolean(body.roomId && body.body && body.body.length <= CHAT_MESSAGES_PROBE.maxMessageLength);
}

export function parseChatMessagesRoomId(searchParams: URLSearchParams): string {
  return searchParams.get('roomId') ?? '';
}

export function parseChatMessagesSince(searchParams: URLSearchParams): Date | null {
  const since = searchParams.get('since');
  if (!since) return null;
  const sinceDate = new Date(since);
  return Number.isNaN(sinceDate.getTime()) ? null : sinceDate;
}