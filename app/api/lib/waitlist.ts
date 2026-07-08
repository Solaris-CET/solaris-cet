export const WAITLIST_PATH = '/api/waitlist';
export const WAITLIST_METHODS = 'POST, OPTIONS';

export const WAITLIST_PROBE = {
  path: WAITLIST_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  rateLimitKey: 'waitlist' as const,
  rateLimit: 6,
  rateWindowSeconds: 60,
  minEmailLength: 6,
  maxEmailLength: 254,
  envWebhookKey: 'WAITLIST_WEBHOOK_URL' as const,
  notConfiguredMessage: 'Waitlist not configured' as const,
  cacheControl: 'no-store' as const,
};

export function isValidWaitlistEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < WAITLIST_PROBE.minEmailLength || e.length > WAITLIST_PROBE.maxEmailLength) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function parseWaitlistEmail(body: unknown): string {
  return typeof (body as { email?: unknown })?.email === 'string' ? (body as { email: string }).email.trim() : '';
}

export function resolveWaitlistWebhookUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env[WAITLIST_PROBE.envWebhookKey] ?? '').trim();
}