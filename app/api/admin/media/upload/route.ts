import { getDb, schema } from '@/db/client';
import { writeAdminAudit } from '@/api/lib/adminAudit';
import { guardAdminRoute } from '@/api/lib/adminAuth';
import {
  ADMIN_MEDIA_UPLOAD_PROBE,
  base64FromUploadBytes,
  isAllowedMediaMime,
  mediaAssetUrl,
  mediaUploadFilename,
} from '../../../lib/adminMediaUpload';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions } from '@/api/lib/http';
import { withRateLimit } from '@/api/lib/rateLimit';

export { ADMIN_MEDIA_UPLOAD_PATH, ADMIN_MEDIA_UPLOAD_PROBE } from '@/api/lib/adminMediaUpload';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: ADMIN_MEDIA_UPLOAD_PROBE.rateLimitKey,
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await guardAdminRoute(req, { minRole: ADMIN_MEDIA_UPLOAD_PROBE.minRole });
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });

  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('multipart/form-data')) return corsJson(req, 415, { error: 'Expected multipart/form-data' });

  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return corsJson(req, 400, { error: 'Missing file' });
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedMediaMime(mimeType)) return corsJson(req, 400, { error: 'Tip fișier nepermis' });
  const filename = mediaUploadFilename(file.name);

  const { maxBytes } = ADMIN_MEDIA_UPLOAD_PROBE;
  if (typeof file.size === 'number' && file.size > maxBytes) return corsJson(req, 413, { error: 'Fișier prea mare' });
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > maxBytes) return corsJson(req, 413, { error: 'Fișier prea mare' });

  const db = getDb();
  const [asset] = await db
    .insert(schema.cmsAssets)
    .values({
      filename,
      mimeType,
      bytes: buf.byteLength,
      dataBase64: base64FromUploadBytes(buf),
      createdByAdminId: ctx.admin.id,
    })
    .returning();
  await writeAdminAudit(req, ctx, ADMIN_MEDIA_UPLOAD_PROBE.auditAction, 'cms_asset', asset.id, {
    filename,
    mimeType,
    bytes: buf.byteLength,
  });
  return corsJson(req, 200, {
    asset: { id: asset.id, filename: asset.filename, mimeType: asset.mimeType, bytes: asset.bytes },
    url: mediaAssetUrl(asset.id),
  });
}