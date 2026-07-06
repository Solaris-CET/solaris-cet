import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

function parseType(v: unknown): 'stake' | 'unstake' | 'claim' | 'vote' | 'bridge' | 'onramp' | null {
  if (v === 'stake' || v === 'unstake' || v === 'claim' || v === 'vote' || v === 'bridge' || v === 'onramp') return v;
  return null;
}

function parseStatus(v: unknown): 'created' | 'pending' | 'confirmed' | 'failed' | null {
  if (v === 'created' || v === 'pending' || v === 'confirmed' || v === 'failed') return v;
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, OPTIONS');

  const user = await requireUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const db = getDb();
  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(schema.web3Intents)
      .where(eq(schema.web3Intents.userId, user.id))
      .orderBy(desc(schema.web3Intents.createdAt))
      .limit(50);
    return corsJson(req, 200, {
      ok: true,
      intents: rows.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        txHash: r.txHash ?? null,
        providerRef: r.providerRef ?? null,
        meta: r.meta ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const type = parseType((body as { type?: unknown })?.type);
  const status = parseStatus((body as { status?: unknown })?.status) ?? 'created';
  const txHash = typeof (body as { txHash?: unknown })?.txHash === 'string' ? (body as { txHash: string }).txHash.trim().slice(0, 220) : null;
  const providerRef = typeof (body as { providerRef?: unknown })?.providerRef === 'string' ? (body as { providerRef: string }).providerRef.trim().slice(0, 220) : null;
  const meta = (body as { meta?: unknown })?.meta;
  if (!type) return corsJson(req, 400, { error: 'Invalid type' });

  const [row] = await db
    .insert(schema.web3Intents)
    .values({ userId: user.id, type, status, txHash, providerRef, meta: meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : null })
    .returning();
  return corsJson(req, 201, { ok: true, id: row.id });
}
