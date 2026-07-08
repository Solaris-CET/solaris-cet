export const SOCIAL_SHARE_PATH = '/api/social/share';
export const SOCIAL_SHARE_METHODS = 'POST, OPTIONS';

export const SOCIAL_SHARE_PROBE = {
  path: SOCIAL_SHARE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitKey: 'share' as const,
  rateLimit: 12,
  rateWindowSeconds: 60,
  maxPlatformLength: 40,
  maxUrlLength: 600,
  sharePoints: 2,
  shareReason: 'share' as const,
  invalidRequestError: 'Invalid request' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export type ParsedSocialShareBody = {
  platform: string;
  url: string;
};

export function parseSocialShareBody(body: unknown): ParsedSocialShareBody | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as { platform?: unknown; url?: unknown };
  const platform = typeof rec.platform === 'string' ? rec.platform.trim().slice(0, SOCIAL_SHARE_PROBE.maxPlatformLength) : '';
  const url = typeof rec.url === 'string' ? rec.url.trim().slice(0, SOCIAL_SHARE_PROBE.maxUrlLength) : '';
  if (!platform || !url) return null;
  return { platform, url };
}

export function socialShareDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function buildSocialShareDedupeKey(day: string, platform: string, url: string): string {
  return `share:${day}:${platform}:${url}`;
}