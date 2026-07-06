import { z } from 'zod';

import { requireAuth } from '../../lib/auth';
import { decideRateLimit, rateLimitHeaders } from '../../lib/publicApiRateLimit';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
  rateLimitedResponsePublic,
} from '../../lib/publicApiResponse';
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '../../lib/publicApiStore';

export const config = { runtime: 'nodejs' };

const createSchema = z.object({ name: z.string().trim().min(2).max(120) });
const rotateSchema = z.object({ id: z.string().trim().min(10).max(80) });

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, 'GET, POST, DELETE, OPTIONS', 'Content-Type, Authorization');
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({ req, bucket: 'console-api-keys', keyPart: auth.user.id, limit: 120, windowSeconds: 60 });
  if (!d.ok) return rateLimitedResponsePublic(req, d);

  if (req.method === 'GET') {
    const keys = await listApiKeys(auth.user.id);
    return jsonResponsePublic(req, { keys }, 200, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    const url = new URL(req.url);
    const action = (url.searchParams.get('action') ?? '').trim();
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return errorResponsePublic(req, 400, 'invalid_request', 'Invalid JSON body');
    }

    if (action === 'rotate') {
      const parsed = rotateSchema.safeParse(json);
      if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
      let rotated: Awaited<ReturnType<typeof rotateApiKey>> | null;
      try {
        rotated = await rotateApiKey(auth.user.id, parsed.data.id);
      } catch {
        return errorResponsePublic(req, 501, 'not_configured', 'API key hashing not configured');
      }
      if (!rotated) return errorResponsePublic(req, 404, 'not_found', 'API key not found');
      return jsonResponsePublic(req, { apiKey: rotated.apiKey, rawKey: rotated.rawKey }, 200, rateLimitHeaders(d));
    }

    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    let created: Awaited<ReturnType<typeof createApiKey>>;
    try {
      created = await createApiKey(auth.user.id, parsed.data.name);
    } catch {
      return errorResponsePublic(req, 501, 'not_configured', 'API key hashing not configured');
    }
    return jsonResponsePublic(req, { apiKey: created.apiKey, rawKey: created.rawKey }, 201, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', 'Missing id');
    const ok = await revokeApiKey(auth.user.id, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', 'API key not found');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOriginFromReq(req),
        Vary: 'Origin',
        'Cache-Control': 'no-store',
        ...rateLimitHeaders(d),
      },
    });
  }

  return errorResponsePublic(req, 405, 'invalid_request', 'Method not allowed');
}
