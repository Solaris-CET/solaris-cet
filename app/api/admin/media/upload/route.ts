import { getDb, schema } from '../../../../db/client';
import { writeAdminAudit } from '../../../lib/adminAudit';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { getAllowedOrigin } from '../../../lib/cors';
import { corsJson, corsOptions } from '../../../lib/http';
import { withRateLimit } from '../../../lib/rateLimit';

export const config = { runtime: 'nodejs' };

function isAllowedMime(mime: string): boolean {
  return (
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/webp' ||
    mime === 'image/gif' ||
    mime === 'image/svg+xml'
  );
}

function base64FromBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'POST, OPTIONS');
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });

  const limited = await withRateLimit(req, allowedOrigin, {
    keyPrefix: 'admin-media-upload',
    limit: 30,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'editor');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('multipart/form-data')) return corsJson(req, 415, { error: 'Expected multipart/form-data' });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return corsJson(req, 400, { error: 'Missing file' });
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedMime(mimeType)) return corsJson(req, 400, { error: 'Tip fișier nepermis' });
  const filename = (file.name || 'upload').slice(0, 200);

  const maxBytes = 2_500_000;
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
      dataBase64: base64FromBytes(buf),
      createdByAdminId: ctx.admin.id,
    })
    .returning();
  await writeAdminAudit(req, ctx, 'ASSET_UPLOADED', 'cms_asset', asset.id, { filename, mimeType, bytes: buf.byteLength });
  return corsJson(req, 200, { asset: { id: asset.id, filename: asset.filename, mimeType: asset.mimeType, bytes: asset.bytes }, url: `/api/media?id=${asset.id}` });
}
