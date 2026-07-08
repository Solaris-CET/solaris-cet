import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireAuth } from '@/api/lib/auth';
import {
  AI_ATTACHMENTS_PROBE,
  attachmentDownloadUrl,
  base64FromBytes,
  decodeAttachmentBase64,
  isAllowedAttachmentMime,
  parseAttachmentGetId,
  sanitizeAttachmentFilename,
} from '../../lib/aiAttachments';
import { getAllowedOrigin } from '@/api/lib/cors';
import { withUpstashRateLimit } from '@/api/lib/rateLimit';

export { AI_ATTACHMENTS_PATH, AI_ATTACHMENTS_PROBE } from '@/api/lib/aiAttachments';

export const config = { runtime: 'nodejs' };

function jsonResponse(allowedOrigin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-MFA-Code',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse(allowedOrigin, { error: 'Method not allowed' }, 405);
  }

  const limited = await withUpstashRateLimit(req, allowedOrigin, {
    keyPrefix: AI_ATTACHMENTS_PROBE.rateLimitKey,
    limit: AI_ATTACHMENTS_PROBE.rateLimit,
    windowSeconds: AI_ATTACHMENTS_PROBE.rateWindowSeconds,
  });
  if (limited) return limited;

  if (!process.env.DATABASE_URL?.trim()) {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  const ctx = auth;

  if (req.method === 'GET') {
    const id = parseAttachmentGetId(new URL(req.url).searchParams);
    if (!id) return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.missingIdError }, 400);
    try {
      const db = getDb();
      const [row] = await db
        .select({ dataBase64: schema.aiAttachments.dataBase64, mimeType: schema.aiAttachments.mimeType, filename: schema.aiAttachments.filename })
        .from(schema.aiAttachments)
        .where(and(eq(schema.aiAttachments.id, id), eq(schema.aiAttachments.userId, ctx.user.id)));
      if (!row) return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.notFoundError }, 404);
      const bytes = decodeAttachmentBase64(row.dataBase64);
      return new Response(bytes as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': row.mimeType,
          'Content-Disposition': `inline; filename="${row.filename.replace(/"/g, '')}"`,
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        },
      });
    } catch {
      return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
    }
  }

  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('multipart/form-data')) {
    return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.expectedMultipartError }, 415);
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.missingFileError }, 400);

  const filename = sanitizeAttachmentFilename(file.name);
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedAttachmentMime(mimeType)) {
    return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.invalidMimeError }, 400);
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > AI_ATTACHMENTS_PROBE.maxBytes) {
    return jsonResponse(allowedOrigin, { error: AI_ATTACHMENTS_PROBE.tooLargeError }, 413);
  }

  try {
    const db = getDb();
    const [row] = await db
      .insert(schema.aiAttachments)
      .values({
        userId: ctx.user.id,
        filename,
        mimeType,
        bytes: buf.byteLength,
        dataBase64: base64FromBytes(buf),
      })
      .returning({ id: schema.aiAttachments.id, filename: schema.aiAttachments.filename, mimeType: schema.aiAttachments.mimeType, bytes: schema.aiAttachments.bytes });

    return jsonResponse(
      allowedOrigin,
      { attachment: row ?? null, url: row ? attachmentDownloadUrl(row.id) : null },
      200,
    );
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}