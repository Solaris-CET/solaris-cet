import {
  buildExportAdVideoPreviewUrl,
  exportAdVideoDimensions,
  parseExportAdVideoBody,
} from '../../../lib/adminAnimationsExportAdVideo';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export {
  ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH,
  ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE,
} from '../../../lib/adminAnimationsExportAdVideo';

export const config = { runtime: 'nodejs' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return corsOptions(request, 'POST, OPTIONS');
  if (request.method !== 'POST') return corsJson(request, 405, { error: 'Method not allowed' });

  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(request, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(request, allowedOrigin, {
    keyPrefix: 'admin-export-ad-video',
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(request, { minRole: 'editor' });
  if ('error' in ctx) return corsJson(request, ctx.status, { error: ctx.error });

  try {
    const parsed = parseExportAdVideoBody(await request.json());
    if (!parsed.ok) return corsJson(request, 400, { error: parsed.error });

    const { animation, format, ctaText } = parsed;
    const { width, height } = exportAdVideoDimensions(format);
    const videoUrl = buildExportAdVideoPreviewUrl(animation, format, ctaText);

    return corsJson(request, 200, {
      success: true,
      videoUrl,
      metadata: {
        animation,
        format,
        width,
        height,
        durationSeconds: 15,
        ctaText,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return corsJson(request, 503, { error: 'Serviciul este temporar indisponibil.' });
  }
}