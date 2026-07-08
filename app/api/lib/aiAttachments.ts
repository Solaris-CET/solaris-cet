export const AI_ATTACHMENTS_PATH = '/api/ai/attachments';
export const AI_ATTACHMENTS_METHODS = 'GET, POST, OPTIONS';

export const AI_ATTACHMENTS_PROBE = {
  path: AI_ATTACHMENTS_PATH,
  methods: ['GET', 'POST', 'OPTIONS'] as const,
  authRequired: true,
  rateLimitKey: 'cet-ai-attachments' as const,
  rateLimit: 12,
  rateWindowSeconds: 10,
  maxBytes: 1_500_000,
  maxFilenameLength: 200,
  missingIdError: 'Missing id' as const,
  missingFileError: 'Missing file' as const,
  notFoundError: 'Not found' as const,
  invalidMimeError: 'Tip fișier nepermis' as const,
  tooLargeError: 'Fișier prea mare' as const,
  expectedMultipartError: 'Expected multipart/form-data' as const,
};

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
]);

export function isAllowedAttachmentMime(mime: string): boolean {
  return ALLOWED_MIMES.has(mime);
}

export function parseAttachmentGetId(searchParams: URLSearchParams): string {
  return (searchParams.get('id') ?? '').trim();
}

export function base64FromBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function decodeAttachmentBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}

export function sanitizeAttachmentFilename(name: string): string {
  return (name || 'attachment').slice(0, AI_ATTACHMENTS_PROBE.maxFilenameLength);
}

export function attachmentDownloadUrl(id: string): string {
  return `${AI_ATTACHMENTS_PATH}?id=${id}`;
}