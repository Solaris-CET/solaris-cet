export const ADMIN_CHAT_ANALYTICS_PATH = '/api/admin/chat-analytics';
export const ADMIN_CHAT_ANALYTICS_METHODS = 'GET, OPTIONS';

export const ADMIN_CHAT_ANALYTICS_TOPIC_KEYWORDS = [
  'pret',
  'cost',
  'finantare',
  'montaj',
  'garantie',
  'acoperis',
  'fotovoltaic',
  'contact',
  'program',
  'casa verde',
] as const;

export const ADMIN_CHAT_ANALYTICS_PROBE = {
  path: ADMIN_CHAT_ANALYTICS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'viewer' as const,
  unauthenticatedStatus: 401,
  defaultPage: 1,
  defaultLimit: 20,
  minLimit: 1,
  maxLimit: 100,
  topicKeywords: ADMIN_CHAT_ANALYTICS_TOPIC_KEYWORDS,
};

export function parseChatAnalyticsPage(searchParams: URLSearchParams): number {
  const page = Number(searchParams.get('page'));
  if (!Number.isFinite(page) || page < 1) return ADMIN_CHAT_ANALYTICS_PROBE.defaultPage;
  return Math.floor(page);
}

export function parseChatAnalyticsLimit(searchParams: URLSearchParams): number {
  const limit = Number(searchParams.get('limit'));
  if (!Number.isFinite(limit)) return ADMIN_CHAT_ANALYTICS_PROBE.defaultLimit;
  return Math.min(
    ADMIN_CHAT_ANALYTICS_PROBE.maxLimit,
    Math.max(ADMIN_CHAT_ANALYTICS_PROBE.minLimit, Math.floor(limit)),
  );
}

export function parseChatAnalyticsSessionId(searchParams: URLSearchParams): string {
  return String(searchParams.get('session_id') ?? '').trim();
}

export function parseChatAnalyticsResolvedFilter(searchParams: URLSearchParams): 'true' | 'false' | null {
  const raw = searchParams.get('resolved');
  if (raw === 'true' || raw === 'false') return raw;
  return null;
}

export function chatAnalyticsOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}