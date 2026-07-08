export const CONSOLE_WEBHOOK_DELIVERIES_PATH = '/api/console/webhooks/deliveries';
export const CONSOLE_WEBHOOK_DELIVERIES_METHODS = 'GET, OPTIONS';

export const CONSOLE_WEBHOOK_DELIVERIES_PROBE = {
  path: CONSOLE_WEBHOOK_DELIVERIES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitBucket: 'console-webhook-deliveries' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  defaultLimit: 50,
  missingEndpointIdError: 'Missing endpointId' as const,
};

export function parseConsoleWebhookDeliveriesEndpointId(searchParams: URLSearchParams): string {
  return (searchParams.get('endpointId') ?? '').trim();
}

export function parseConsoleWebhookDeliveriesLimit(searchParams: URLSearchParams): number {
  const limit = Number(searchParams.get('limit') ?? String(CONSOLE_WEBHOOK_DELIVERIES_PROBE.defaultLimit));
  return Number.isFinite(limit) ? limit : CONSOLE_WEBHOOK_DELIVERIES_PROBE.defaultLimit;
}