import { getAllowedOrigin } from '../../lib/cors';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = (await req.json()) as { query?: unknown };
    const query =
      typeof body.query === 'string' && body.query.trim()
        ? body.query.trim()
        : 'How to stake CET?';

    const graph = [
      'graph TD',
      `  A[User asks: "${query.replace(/"/g, "'")}"] --> B{Is wallet connected?}`,
      '  B -->|Yes| C[Show staking options]',
      '  B -->|No| D[Show connect wallet]',
      '  C --> E[Show staking calculator]',
      '  E --> F[Show estimated rewards]',
    ].join('\n');

    return jsonResponse(
      {
        format: 'mermaid',
        graph,
        render: 'client',
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }
}

