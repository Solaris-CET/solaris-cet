import { getAllowedOrigin } from './cors';

export function ensureAllowedOrigin(req: Request): { allowedOrigin: string } | Response {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }
  return { allowedOrigin };
}

