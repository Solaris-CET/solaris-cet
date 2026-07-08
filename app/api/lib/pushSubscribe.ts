export const PUSH_SUBSCRIBE_PATH = '/api/push/subscribe';
export const PUSH_SUBSCRIBE_METHODS = 'POST, OPTIONS';

export const PUSH_SUBSCRIBE_PROBE = {
  path: PUSH_SUBSCRIBE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidJsonError: 'Invalid JSON' as const,
  invalidSubscriptionError: 'Invalid subscription' as const,
};

export type ParsedPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function parsePushSubscribeBody(body: unknown): ParsedPushSubscription | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as { endpoint?: unknown; keys?: unknown };
  const endpoint = typeof rec.endpoint === 'string' ? rec.endpoint.trim() : '';
  const keys = rec.keys && typeof rec.keys === 'object' ? (rec.keys as { p256dh?: unknown; auth?: unknown }) : undefined;
  const p256dh = typeof keys?.p256dh === 'string' ? keys.p256dh.trim() : '';
  const auth = typeof keys?.auth === 'string' ? keys.auth.trim() : '';
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}