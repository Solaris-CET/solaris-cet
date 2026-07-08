export const COMMUNITY_SHARE_AI_PATH = '/api/community/share-ai';
export const COMMUNITY_SHARE_AI_METHODS = 'POST, OPTIONS';

export const COMMUNITY_SHARE_AI_PROBE = {
  path: COMMUNITY_SHARE_AI_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  telegramInitHeader: 'X-Telegram-Init-Data' as const,
  rateLimitKey: 'community-share-ai' as const,
  rateLimit: 10,
  rateWindowSeconds: 60,
  sharePoints: 5,
  defaultContext: 'cet-ai' as const,
  maxContextLength: 80,
  missingInitDataError: 'Missing Telegram initData' as const,
  invalidInitDataError: 'Invalid Telegram initData' as const,
  missingTelegramUserError: 'Missing Telegram user' as const,
  notLinkedError: 'Telegram not linked' as const,
};

export function parseCommunityShareAiContext(body: unknown): string {
  if (typeof body !== 'object' || body === null) return COMMUNITY_SHARE_AI_PROBE.defaultContext;
  if (!('context' in body)) return COMMUNITY_SHARE_AI_PROBE.defaultContext;
  const v = (body as { context?: unknown }).context;
  if (typeof v !== 'string') return COMMUNITY_SHARE_AI_PROBE.defaultContext;
  const t = v.trim();
  return t ? t.slice(0, COMMUNITY_SHARE_AI_PROBE.maxContextLength) : COMMUNITY_SHARE_AI_PROBE.defaultContext;
}

export function communityShareAiDedupeKey(day: string): string {
  return `share-ai:${day}`;
}