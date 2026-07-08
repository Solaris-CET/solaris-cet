export const CMS_MEDIA_PATH = '/api/media';
export const CMS_MEDIA_METHODS = 'GET, OPTIONS';

export const CMS_MEDIA_PROBE = {
  path: CMS_MEDIA_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  queryParam: 'id' as const,
  cacheControl: 'public, max-age=31536000, immutable' as const,
  missingIdError: 'Missing id' as const,
  notFoundError: 'Not found' as const,
};

export function parseCmsMediaId(url: URL): string | null {
  const id = (url.searchParams.get(CMS_MEDIA_PROBE.queryParam) ?? '').trim();
  return id || null;
}

export function decodeCmsMediaBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}