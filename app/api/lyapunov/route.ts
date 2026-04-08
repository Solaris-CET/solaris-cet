import { getAllowedOrigin } from '../lib/cors';

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

function toFiniteNumber(v: unknown): number | null {
  if (typeof v !== 'number') return null;
  if (!Number.isFinite(v)) return null;
  return v;
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
    const body = (await req.json()) as { state?: unknown };
    const state = (body?.state ?? {}) as Record<string, unknown>;

    const balance = toFiniteNumber(state.balance);
    const price = toFiniteNumber(state.price);
    const volatility = toFiniteNumber(state.volatility);

    if (balance === null || price === null || volatility === null) {
      return jsonResponse(
        { error: 'Invalid state: expected numeric { balance, price, volatility }' },
        allowedOrigin,
        400,
      );
    }

    const score = balance * price - volatility;
    const stable = score >= 0;

    return jsonResponse(
      {
        stable,
        score,
        model: 'heuristic',
      },
      allowedOrigin,
      200,
    );
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }
}

