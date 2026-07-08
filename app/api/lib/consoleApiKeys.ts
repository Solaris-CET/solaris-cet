import { z } from 'zod';

export const CONSOLE_API_KEYS_PATH = '/api/console/api-keys';
export const CONSOLE_API_KEYS_METHODS = 'GET, POST, DELETE, OPTIONS';

export const CONSOLE_API_KEYS_PROBE = {
  path: CONSOLE_API_KEYS_PATH,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitBucket: 'console-api-keys' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  rotateAction: 'rotate' as const,
  minNameLength: 2,
  maxNameLength: 120,
  minIdLength: 10,
  maxIdLength: 80,
  missingIdError: 'Missing id' as const,
  notFoundError: 'API key not found' as const,
  notConfiguredError: 'API key hashing not configured' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export const consoleApiKeyCreateSchema = z.object({
  name: z.string().trim().min(CONSOLE_API_KEYS_PROBE.minNameLength).max(CONSOLE_API_KEYS_PROBE.maxNameLength),
});

export const consoleApiKeyRotateSchema = z.object({
  id: z.string().trim().min(CONSOLE_API_KEYS_PROBE.minIdLength).max(CONSOLE_API_KEYS_PROBE.maxIdLength),
});

export function parseConsoleApiKeysAction(searchParams: URLSearchParams): string {
  return (searchParams.get('action') ?? '').trim();
}

export function parseConsoleApiKeysDeleteId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}