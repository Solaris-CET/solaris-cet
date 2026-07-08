export const ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH = '/api/admin/animations/export-ad-video';
export const ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_METHODS = 'POST, OPTIONS';

export const ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_FORMATS = ['1080x1920', '1920x1080'] as const;
export type ExportAdVideoFormat = (typeof ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_FORMATS)[number];

export const ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE = {
  path: ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  rateLimitKey: 'admin-export-ad-video',
  unauthenticatedStatus: 401,
  defaultFormat: '1080x1920' as ExportAdVideoFormat,
  defaultCta: 'Cere ofertă gratuită → solaris-cet.com',
  durationSeconds: 15,
};

export function parseExportAdVideoFormat(raw: unknown): ExportAdVideoFormat {
  if (
    typeof raw === 'string' &&
    (ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_FORMATS as readonly string[]).includes(raw)
  ) {
    return raw as ExportAdVideoFormat;
  }
  return ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE.defaultFormat;
}

export function parseExportAdVideoCta(raw: unknown): string {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PROBE.defaultCta;
}

export type ExportAdVideoBody =
  | { ok: true; animation: string; format: ExportAdVideoFormat; ctaText: string }
  | { ok: false; error: string };

export function parseExportAdVideoBody(body: unknown): ExportAdVideoBody {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Parametrul "animation" este obligatoriu și trebuie să fie un string.' };
  }
  const { animation, format, ctaText } = body as {
    animation?: unknown;
    format?: unknown;
    ctaText?: unknown;
  };
  if (!animation || typeof animation !== 'string') {
    return { ok: false, error: 'Parametrul "animation" este obligatoriu și trebuie să fie un string.' };
  }
  return {
    ok: true,
    animation,
    format: parseExportAdVideoFormat(format),
    ctaText: parseExportAdVideoCta(ctaText),
  };
}

export function buildExportAdVideoPreviewUrl(
  animation: string,
  format: ExportAdVideoFormat,
  ctaText: string,
): string {
  return `${ADMIN_ANIMATIONS_EXPORT_AD_VIDEO_PATH}/preview?animation=${encodeURIComponent(animation)}&format=${encodeURIComponent(format)}&cta=${encodeURIComponent(ctaText)}`;
}

export function exportAdVideoDimensions(format: ExportAdVideoFormat): { width: number; height: number } {
  const [width, height] = format.split('x').map(Number);
  return { width: width ?? 0, height: height ?? 0 };
}