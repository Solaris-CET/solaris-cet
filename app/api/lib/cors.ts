/**
 * Shared CORS allowlist for API routes under `app/api/`.
 * Keep in sync with deployment origins (solaris-cet.com, previews, local dev).
 */

const ALLOWED_ORIGINS = new Set([
  'https://solaris-cet.com',
  'https://www.solaris-cet.com',
  'https://solaris-cet.vercel.app',
  'https://solaris-cet.github.io',
]);

export function getAllowedOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  if (origin && (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost'))) {
    return origin;
  }
  return 'https://solaris-cet.com';
}
