import { z } from 'zod';

export const CONSOLE_WEBHOOKS_PATH = '/api/console/webhooks';
export const CONSOLE_WEBHOOKS_METHODS = 'GET, POST, DELETE, OPTIONS';

export const CONSOLE_WEBHOOKS_PROBE = {
  path: CONSOLE_WEBHOOKS_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitBucket: 'console-webhooks' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  maxUrlLength: 800,
  maxEvents: 50,
  maxEventNameLength: 80,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Webhook endpoint not found' as const,
  notConfiguredError: 'Webhook secrets are not configured' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export const consoleWebhookCreateSchema = z.object({
  url: z.string().trim().url().max(CONSOLE_WEBHOOKS_PROBE.maxUrlLength),
  events: z.array(z.string().trim().min(1).max(CONSOLE_WEBHOOKS_PROBE.maxEventNameLength)).max(CONSOLE_WEBHOOKS_PROBE.maxEvents).default([]),
  enabled: z.boolean().optional().default(true),
});

export function parseConsoleWebhooksDeleteId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}