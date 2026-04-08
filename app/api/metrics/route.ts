import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

function response(text: string, allowedOrigin: string): Response {
  return new Response(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
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
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response('method not allowed', { status: 405 });
  }

  const dbConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const aiConfigured = Boolean(
    (process.env.GROK_API_KEY?.trim() || process.env.GROK_API_KEY_ENC?.trim()) &&
      (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY_ENC?.trim()),
  );
  const tonConfigured = Boolean(process.env.TONCENTER_RPC_URL?.trim() || process.env.TONCENTER_API_KEY?.trim());
  const now = Math.floor(Date.now() / 1000);

  const lines = [
    '# HELP solaris_up Service is up (static).',
    '# TYPE solaris_up gauge',
    'solaris_up 1',
    '# HELP solaris_time_seconds Current server time in seconds since epoch.',
    '# TYPE solaris_time_seconds gauge',
    `solaris_time_seconds ${now}`,
    '# HELP solaris_ai_configured AI env keys configured.',
    '# TYPE solaris_ai_configured gauge',
    `solaris_ai_configured ${aiConfigured ? 1 : 0}`,
    '# HELP solaris_db_configured DATABASE_URL configured.',
    '# TYPE solaris_db_configured gauge',
    `solaris_db_configured ${dbConfigured ? 1 : 0}`,
    '# HELP solaris_ton_configured TON RPC/indexer env configured.',
    '# TYPE solaris_ton_configured gauge',
    `solaris_ton_configured ${tonConfigured ? 1 : 0}`,
    '',
  ];

  return response(lines.join('\n'), allowedOrigin);
}

