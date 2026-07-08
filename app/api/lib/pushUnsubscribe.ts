export const PUSH_UNSUBSCRIBE_PATH = '/api/push/unsubscribe';
export const PUSH_UNSUBSCRIBE_METHODS = 'POST, OPTIONS';

export const PUSH_UNSUBSCRIBE_PROBE = {
  path: PUSH_UNSUBSCRIBE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  invalidJsonError: 'Invalid JSON' as const,
  missingEndpointError: 'Missing endpoint' as const,
};

export function parsePushUnsubscribeEndpoint(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const endpoint = (body as { endpoint?: unknown }).endpoint;
  const value = typeof endpoint === 'string' ? endpoint.trim() : '';
  return value || null;
}