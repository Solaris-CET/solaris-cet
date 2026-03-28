/**
 * CORS helpers for root-level Vercel serverless routes (`/api/*`).
 * Mirrors the allowlist in `app/api/chat/route.ts` and `app/api/auth/route.ts`.
 */

const ALLOWED_ORIGINS = new Set([
  'https://solaris-cet.com',
  'https://www.solaris-cet.com',
  'https://solaris-cet.vercel.app',
  'https://solaris-cet.github.io',
]);

/** Reflected `Access-Control-Allow-Origin` when the request Origin is trusted. */
export function getAllowedOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  if (origin && (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost'))) {
    return origin;
  }
  return 'https://solaris-cet.com';
}

export function corsJsonHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
  };
}

export function corsPreflightHeaders(allowedOrigin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}
