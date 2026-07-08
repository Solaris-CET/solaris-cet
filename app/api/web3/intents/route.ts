import { desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';
import {
  buildWeb3IntentCreateResponse,
  buildWeb3IntentsListResponse,
  mapWeb3IntentRow,
  parseWeb3IntentCreateBody,
  WEB3_INTENTS_PROBE,
} from '../../lib/web3Intents';

export { WEB3_INTENTS_PATH, WEB3_INTENTS_PROBE } from '@/api/lib/web3Intents';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, WEB3_INTENTS_PROBE.methods.join(', '));

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
      .limit(WEB3_INTENTS_PROBE.listLimit);
    return corsJson(req, 200, buildWeb3IntentsListResponse(rows.map(mapWeb3IntentRow)));
  }

  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return corsJson(req, 400, { error: WEB3_INTENTS_PROBE.invalidJsonError });
  }

  const parsed = parseWeb3IntentCreateBody(body);
  if (!parsed) return corsJson(req, 400, { error: WEB3_INTENTS_PROBE.invalidTypeError });

  const [row] = await db
    .insert(schema.web3Intents)
    .values({
      userId: user.id,
      type: parsed.type,
      status: parsed.status,
      txHash: parsed.txHash,
      providerRef: parsed.providerRef,
      meta: parsed.meta,
    })
    .returning();
  return corsJson(req, 201, buildWeb3IntentCreateResponse(row.id));
}