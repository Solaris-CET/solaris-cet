export const PUBLIC_V1_WEBHOOK_DELIVERIES_PATH = '/api/v1/webhooks/deliveries';
export const PUBLIC_V1_WEBHOOK_DELIVERIES_METHODS = 'GET, OPTIONS';

export const PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE = {
  path: PUBLIC_V1_WEBHOOK_DELIVERIES_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v1' as const,
  rateLimitBucket: 'public-v1-webhook-deliveries' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  defaultLimit: 50,
  endpointIdParam: 'endpointId' as const,
};

export function parsePublicV1WebhookDeliveriesLimit(raw: string | null): number {
  return Number(raw ?? String(PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.defaultLimit));
}

export function buildPublicV1WebhookDeliveriesBody(items: unknown[]) {
  return { version: PUBLIC_V1_WEBHOOK_DELIVERIES_PROBE.apiVersion, items };
}