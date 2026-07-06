import { getAllowedOrigin } from './cors';
import { rateLimitHeaders } from './publicApiRateLimit';

export type PublicApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'invalid_request'
  | 'rate_limited'
  | 'not_configured'
  | 'internal_error';

export function allowedOriginFromReq(req: Request): string {
  return getAllowedOrigin(req.headers.get('origin'));
}

export function optionsResponsePublic(req: Request, allowMethods: string, allowHeaders: string): Response {
  const allowedOrigin = allowedOriginFromReq(req);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': allowMethods,
      'Access-Control-Allow-Headers': allowHeaders,
      Vary: 'Origin',
    },
  });
}

export function jsonResponsePublic(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  const allowedOrigin = allowedOriginFromReq(req);
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

export function errorResponsePublic(
  req: Request,
  status: number,
  code: PublicApiErrorCode,
  message: string,
  details?: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  return jsonResponsePublic(
    req,
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    status,
    extraHeaders,
  );
}

export function rateLimitedResponsePublic(req: Request, d: Parameters<typeof rateLimitHeaders>[0]): Response {
  return errorResponsePublic(req, 429, 'rate_limited', 'Rate limited', null, rateLimitHeaders(d));
}

