export const CACHE_PATH = '/api/cache';
export const CACHE_METHODS = 'GET, OPTIONS';

export const CACHE_PROBE = {
  path: CACHE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  upstashKey: 'cet-state-json' as const,
  upstashTtlSeconds: 60,
  fallbackStatePath: '/api/state.json' as const,
  unavailableError: 'unavailable' as const,
};