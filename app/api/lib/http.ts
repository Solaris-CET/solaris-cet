import { getAllowedOrigin } from './cors';

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
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

export function optionsResponse(req: Request, allowMethods: string, allowHeaders: string): Response {
  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
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

