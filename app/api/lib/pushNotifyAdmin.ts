export const PUSH_NOTIFY_ADMIN_PATH = '/api/push/notify-admin';
export const PUSH_NOTIFY_ADMIN_METHODS = 'POST';

export const PUSH_NOTIFY_ADMIN_PROBE = {
  path: PUSH_NOTIFY_ADMIN_PATH,
  methods: ['POST'] as const,
  authRequired: true,
  internalTokenEnv: 'INTERNAL_PUSH_TOKEN' as const,
  rateLimitKey: 'push_notify_admin' as const,
  rateLimit: 30,
  rateWindowSeconds: 60,
  maxTitleLength: 120,
  maxBodyLength: 400,
  defaultTitle: 'Notificare Solaris CET' as const,
  notConfiguredStatus: 501,
  forbiddenStatus: 403,
  invalidJsonError: 'Invalid JSON' as const,
  notConfiguredError: 'Push notify-admin not configured' as const,
  forbiddenError: 'Forbidden' as const,
  adminRole: 'admin' as const,
  adminSubscriptionLimit: 100,
  pushIcon: '/icon-192.png' as const,
  pushBadge: '/badge-72.png' as const,
};

export type PushNotifyAdminBody = {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type ParsedPushNotifyAdminPayload = {
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export function readInternalPushToken(): string {
  return String(process.env[PUSH_NOTIFY_ADMIN_PROBE.internalTokenEnv] ?? '').trim();
}

export function isInternalPushAuthorized(req: Request, token: string): boolean {
  const auth = req.headers.get('authorization') || '';
  return Boolean(token) && auth === `Bearer ${token}`;
}

export function parsePushNotifyAdminBody(body: unknown): ParsedPushNotifyAdminPayload | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as PushNotifyAdminBody;
  const titleRaw = typeof rec.title === 'string' ? rec.title.trim() : '';
  const notificationBodyRaw = typeof rec.body === 'string' ? rec.body.trim() : '';
  const title = (titleRaw || PUSH_NOTIFY_ADMIN_PROBE.defaultTitle).slice(0, PUSH_NOTIFY_ADMIN_PROBE.maxTitleLength);
  const notificationBody = notificationBodyRaw.slice(0, PUSH_NOTIFY_ADMIN_PROBE.maxBodyLength);
  const data = rec.data && typeof rec.data === 'object' ? rec.data : {};
  return { title, body: notificationBody, data };
}