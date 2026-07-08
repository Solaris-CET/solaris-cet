import { z } from 'zod';

export const PUBLIC_V1_WEBHOOKS_PATH = '/api/v1/webhooks';
export const PUBLIC_V1_WEBHOOKS_METHODS = 'GET, POST, DELETE, OPTIONS';

export const PUBLIC_V1_WEBHOOKS_PROBE = {
  path: PUBLIC_V1_WEBHOOKS_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  apiVersion: 'v1' as const,
  rateLimitBucket: 'public-v1-webhooks' as const,
  rateLimit: 60,
  rateWindowSeconds: 60,
  notConfiguredCode: 'not_configured' as const,
  notConfiguredMessage: 'Webhook secrets are not configured' as const,
};

export const publicV1WebhookCreateSchema = z.object({
  url: z.string().trim().url().max(800),
  events: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  enabled: z.boolean().optional().default(true),
});

export function buildPublicV1WebhooksListBody(items: unknown[]) {
  return { version: PUBLIC_V1_WEBHOOKS_PROBE.apiVersion, items };
}

export function buildPublicV1WebhookCreateBody(endpoint: unknown, secret: string) {
  return { version: PUBLIC_V1_WEBHOOKS_PROBE.apiVersion, endpoint, secret };
}