import { PRODUCTION_SITE_ORIGIN } from '../../src/lib/brandAssetFilenames';

export function publicOrigin(req?: Request): string {
  const fromEnv = String(process.env.VITE_APP_ORIGIN ?? '').trim();
  if (fromEnv) return fromEnv;

  const host = req?.headers.get('x-forwarded-host') ?? req?.headers.get('host');
  const proto = req?.headers.get('x-forwarded-proto') ?? 'https';
  const h = String(host ?? '').split(',')[0]?.trim();
  const p = String(proto ?? '').split(',')[0]?.trim();
  if (h) return `${p}://${h}`;

  return PRODUCTION_SITE_ORIGIN;
}

