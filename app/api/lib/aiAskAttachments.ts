import { and, eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { safeTrimText } from '@/api/lib/aiAsk';

function jsonResponse(allowedOrigin: string, body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
      'Cache-Control': 'no-store',
      ...(extraHeaders ?? {}),
    },
  });
}

export async function resolveAttachmentsBlock(opts: {
  attachmentIds: string[];
  userId: string | null;
  allowedOrigin: string;
  req: Request;
}): Promise<{ attachmentsBlock: string; resolvedAttachmentIds: string[] } | Response> {
  void opts.req;
  let attachmentsBlock = '';
  let resolvedAttachmentIds: string[] = [];

  if (opts.attachmentIds.length === 0) {
    return { attachmentsBlock, resolvedAttachmentIds };
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return jsonResponse(opts.allowedOrigin, { error: 'Unavailable' }, 503);
  }
  if (!opts.userId) {
    return jsonResponse(opts.allowedOrigin, { error: 'Authentication required for attachments.' }, 401);
  }
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.aiAttachments.id,
        filename: schema.aiAttachments.filename,
        mimeType: schema.aiAttachments.mimeType,
        bytes: schema.aiAttachments.bytes,
        dataBase64: schema.aiAttachments.dataBase64,
      })
      .from(schema.aiAttachments)
      .where(and(eq(schema.aiAttachments.userId, opts.userId), inArray(schema.aiAttachments.id, opts.attachmentIds)));

    resolvedAttachmentIds = rows.map((r) => r.id);
    const lines = rows
      .map((r) => {
        const name = safeTrimText(r.filename, 140);
        const mime = safeTrimText(r.mimeType, 80);
        const bytes = typeof r.bytes === 'number' ? r.bytes : 0;
        if (mime.startsWith('text/') || mime === 'application/json') {
          try {
            const txt = Buffer.from(r.dataBase64, 'base64').toString('utf8');
            const snippet = safeTrimText(txt, 2200);
            return `- ${name} (${mime}, ${bytes} bytes)\n\n${snippet}`;
          } catch {
            return `- ${name} (${mime}, ${bytes} bytes)`;
          }
        }
        return `- ${name} (${mime}, ${bytes} bytes)`;
      })
      .slice(0, 6);

    if (lines.length > 0) {
      attachmentsBlock = `\n\nATTACHMENTS (user-provided):\n${lines.join('\n\n')}`;
    }
  } catch {
    void 0;
  }

  return { attachmentsBlock, resolvedAttachmentIds };
}
