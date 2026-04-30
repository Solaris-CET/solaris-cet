import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getAllowedOrigin } from '../../lib/cors';
import { jsonResponse, optionsResponse } from '../../lib/http';

export const config = { runtime: 'nodejs' };

type ChainState = {
  pool?: { priceTonPerCet?: string | null };
  updatedAt?: string;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req, 'GET, OPTIONS', 'Content-Type');
  }
  if (req.method !== 'GET') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const allowedOrigin = getAllowedOrigin(req.headers.get('origin'));
  try {
    const p = join(process.cwd(), 'public', 'api', 'state.json');
    const raw = await readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as ChainState;
    const priceTonPerCet = typeof parsed.pool?.priceTonPerCet === 'string' ? parsed.pool?.priceTonPerCet : null;
    const updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;
    return jsonResponse(req, { symbol: 'CET', priceTonPerCet, updatedAt });
  } catch {
    return new Response(JSON.stringify({ error: 'Unavailable' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        Vary: 'Origin',
        'Cache-Control': 'no-store',
      },
    });
  }
}

