import { and, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAuth } from '../../lib/auth';
import { getAllowedOrigin } from '../../lib/cors';
import { withUpstashRateLimit } from '../../lib/rateLimit';

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

function base64FromBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function decodeBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}

function isAllowedMime(mime: string): boolean {
  return (
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/webp' ||
    mime === 'image/gif' ||
    mime === 'text/plain' ||
    mime === 'text/markdown' ||
    mime === 'text/csv' ||
    mime === 'application/json' ||
    mime === 'application/pdf'
  );
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
    keyPrefix: 'cet-ai-attachments',
    limit: 12,
    windowSeconds: 10,
  });
  if (limited) return limited;

  if (!process.env.DATABASE_URL?.trim()) {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return jsonResponse(allowedOrigin, { error: auth.error }, auth.status);
  const ctx = auth;

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return jsonResponse(allowedOrigin, { error: 'Missing id' }, 400);
    try {
      const db = getDb();
      const [row] = await db
        .select({ dataBase64: schema.aiAttachments.dataBase64, mimeType: schema.aiAttachments.mimeType, filename: schema.aiAttachments.filename })
        .from(schema.aiAttachments)
        .where(and(eq(schema.aiAttachments.id, id), eq(schema.aiAttachments.userId, ctx.user.id)));
      if (!row) return jsonResponse(allowedOrigin, { error: 'Not found' }, 404);
      const bytes = decodeBase64(row.dataBase64);
      return new Response(bytes, {
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
    return jsonResponse(allowedOrigin, { error: 'Expected multipart/form-data' }, 415);
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return jsonResponse(allowedOrigin, { error: 'Missing file' }, 400);

  const filename = (file.name || 'attachment').slice(0, 200);
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedMime(mimeType)) return jsonResponse(allowedOrigin, { error: 'Tip fișier nepermis' }, 400);

  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength > 1_500_000) return jsonResponse(allowedOrigin, { error: 'Fișier prea mare' }, 413);

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

    return jsonResponse(allowedOrigin, { attachment: row ?? null, url: row ? `/api/ai/attachments?id=${row.id}` : null }, 200);
  } catch {
    return jsonResponse(allowedOrigin, { error: 'Unavailable' }, 503);
  }
}
