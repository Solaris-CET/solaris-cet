import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../lib/cors';
import { corsJson, corsOptions } from '../../../lib/http';
import { withRateLimit } from '../../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

export async function POST(request: Request) {
  if (request.method === 'OPTIONS') return corsOptions(request, 'POST, OPTIONS');

  const origin = request.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(request, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(request, allowedOrigin, {
    keyPrefix: 'admin-export-ad-video',
    limit: 20,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await requireAdminAuth(request);
  if ('error' in ctx) return corsJson(request, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'editor');
  if (!ok.ok) return corsJson(request, ok.status, { error: ok.error });

  try {
    const body = (await request.json()) as {
      animation?: unknown;
      format?: unknown;
      ctaText?: unknown;
    };
    const { animation, format, ctaText } = body;

    // Validare parametri
    if (!animation || typeof animation !== 'string') {
      return corsJson(request, 400, { error: 'Parametrul "animation" este obligatoriu și trebuie să fie un string.' });
    }

    const validFormats = ['1080x1920', '1920x1080'] as const;
    const selectedFormat =
      typeof format === 'string' && validFormats.includes(format as (typeof validFormats)[number]) ? format : '1080x1920';
    const [width, height] = selectedFormat.split('x').map(Number);

    const defaultCta = 'Cere ofertă gratuită → solaris-cet.com';
    const finalCta = ctaText && typeof ctaText === 'string' ? ctaText : defaultCta;

    // Simulare generare video (în producție s-ar folosi Puppeteer + ffmpeg)
    const videoUrl = `/api/admin/animations/export-ad-video/preview?animation=${encodeURIComponent(animation)}&format=${selectedFormat}&cta=${encodeURIComponent(finalCta)}`;

    return corsJson(request, 200, {
      success: true,
      videoUrl,
      metadata: {
        animation,
        format: selectedFormat,
        width,
        height,
        durationSeconds: 15,
        ctaText: finalCta,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return corsJson(request, 503, { error: 'Serviciul este temporar indisponibil.' });
  }
}
