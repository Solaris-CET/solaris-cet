export const ADMIN_MEDIA_UPLOAD_PATH = '/api/admin/media/upload';
export const ADMIN_MEDIA_UPLOAD_METHODS = 'POST, OPTIONS';

export const ADMIN_MEDIA_UPLOAD_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
] as const;

export const ADMIN_MEDIA_UPLOAD_PROBE = {
  path: ADMIN_MEDIA_UPLOAD_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  minRole: 'editor' as const,
  unauthenticatedStatus: 401,
  rateLimitKey: 'admin-media-upload',
  maxBytes: 2_500_000,
  maxFilenameLength: 200,
  auditAction: 'ASSET_UPLOADED' as const,
  allowedMimes: ADMIN_MEDIA_UPLOAD_MIMES,
};

export function isAllowedMediaMime(mime: string): boolean {
  return (ADMIN_MEDIA_UPLOAD_MIMES as readonly string[]).includes(mime);
}

export function mediaUploadFilename(raw: string): string {
  return (raw || 'upload').slice(0, ADMIN_MEDIA_UPLOAD_PROBE.maxFilenameLength);
}

export function base64FromUploadBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function mediaAssetUrl(assetId: string): string {
  return `/api/media?id=${assetId}`;
}