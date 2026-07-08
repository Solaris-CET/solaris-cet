import { requireAuth } from '@/api/lib/auth';
import {
  CONSOLE_API_KEYS_PROBE,
  consoleApiKeyCreateSchema,
  consoleApiKeyRotateSchema,
  parseConsoleApiKeysAction,
  parseConsoleApiKeysDeleteId,
} from '../../lib/consoleApiKeys';
import { decideRateLimit, rateLimitHeaders } from '@/api/lib/publicApiRateLimit';
import {
  allowedOriginFromReq,
  errorResponsePublic,
  jsonResponsePublic,
  optionsResponsePublic,
  rateLimitedResponsePublic,
} from '../../lib/publicApiResponse';
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from '@/api/lib/publicApiStore';

export { CONSOLE_API_KEYS_PATH, CONSOLE_API_KEYS_PROBE } from '@/api/lib/consoleApiKeys';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponsePublic(req, CONSOLE_API_KEYS_PROBE.methods.join(', '), 'Content-Type, Authorization');
  }

  const auth = await requireAuth(req);
  if ('error' in auth) return errorResponsePublic(req, auth.status, 'unauthorized', auth.error);

  const d = decideRateLimit({
    req,
    bucket: CONSOLE_API_KEYS_PROBE.rateLimitBucket,
    keyPart: auth.user.id,
    limit: CONSOLE_API_KEYS_PROBE.rateLimit,
    windowSeconds: CONSOLE_API_KEYS_PROBE.rateWindowSeconds,
  });
  if (!d.ok) return rateLimitedResponsePublic(req, d);

  if (req.method === 'GET') {
    const keys = await listApiKeys(auth.user.id);
    return jsonResponsePublic(req, { keys }, 200, rateLimitHeaders(d));
  }

  if (req.method === 'POST') {
    const url = new URL(req.url);
    const action = parseConsoleApiKeysAction(url.searchParams);
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return errorResponsePublic(req, 400, 'invalid_request', CONSOLE_API_KEYS_PROBE.invalidJsonError);
    }

    if (action === CONSOLE_API_KEYS_PROBE.rotateAction) {
      const parsed = consoleApiKeyRotateSchema.safeParse(json);
      if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
      let rotated: Awaited<ReturnType<typeof rotateApiKey>> | null;
      try {
        rotated = await rotateApiKey(auth.user.id, parsed.data.id);
      } catch {
        return errorResponsePublic(req, 501, 'not_configured', CONSOLE_API_KEYS_PROBE.notConfiguredError);
      }
      if (!rotated) return errorResponsePublic(req, 404, 'not_found', CONSOLE_API_KEYS_PROBE.notFoundError);
      return jsonResponsePublic(req, { apiKey: rotated.apiKey, rawKey: rotated.rawKey }, 200, rateLimitHeaders(d));
    }

    const parsed = consoleApiKeyCreateSchema.safeParse(json);
    if (!parsed.success) return errorResponsePublic(req, 400, 'invalid_request', 'Invalid request', parsed.error.flatten());
    let created: Awaited<ReturnType<typeof createApiKey>>;
    try {
      created = await createApiKey(auth.user.id, parsed.data.name);
    } catch {
      return errorResponsePublic(req, 501, 'not_configured', CONSOLE_API_KEYS_PROBE.notConfiguredError);
    }
    return jsonResponsePublic(req, { apiKey: created.apiKey, rawKey: created.rawKey }, 201, rateLimitHeaders(d));
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url);
    const id = parseConsoleApiKeysDeleteId(url.searchParams);
    if (!id) return errorResponsePublic(req, 400, 'invalid_request', CONSOLE_API_KEYS_PROBE.missingIdError);
    const ok = await revokeApiKey(auth.user.id, id);
    if (!ok) return errorResponsePublic(req, 404, 'not_found', CONSOLE_API_KEYS_PROBE.notFoundError);
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