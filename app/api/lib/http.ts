import { getAllowedOrigin } from './cors';

export function corsJson(
  req: Request,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
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

export function corsOptions(req: Request, methods = 'POST, OPTIONS'): Response {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      Vary: 'Origin',
    },
  });
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return corsJson(req, status, body, extraHeaders);
}

export function optionsResponse(
  req: Request,
  methods = 'POST, OPTIONS',
  allowHeaders = 'Content-Type, Authorization',
): Response {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': allowHeaders,
      Vary: 'Origin',
    },
  });
}

export async function readJson(req: Request): Promise<unknown> {
  return await req.json();
}

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
