import { PRODUCTION_SITE_ORIGIN } from './brandAssetFilenames';

const ALLOWED_ORIGINS = new Set([PRODUCTION_SITE_ORIGIN, 'https://www.solaris-cet.com', 'https://solaris-cet.github.io']);

export function getAllowedOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  if (origin && origin.startsWith('http://localhost')) return origin;
  return PRODUCTION_SITE_ORIGIN;
}
