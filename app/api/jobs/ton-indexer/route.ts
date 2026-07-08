import { desc } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { getAllowedOrigin } from '@/api/lib/cors';
import { requireCron } from '@/api/lib/cron';
import { corsJson, corsOptions } from '@/api/lib/http';
import { parseTonNetwork } from '@/api/lib/tonapi';
import {
  parseTonIndexerLimit,
  TON_INDEXER_JOB_PROBE,
  upsertTonIndexerEventsForAddress,
} from '../../lib/tonIndexerJob';
import { tonAddressSchema } from '@/api/lib/validation';

export { TON_INDEXER_JOB_PATH, TON_INDEXER_JOB_PROBE } from '@/api/lib/tonIndexerJob';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, TON_INDEXER_JOB_PROBE.methods.join(', '));
  if (req.method !== 'POST') return corsJson(req, 405, { error: 'Method not allowed' });
  if (!requireCron(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const url = new URL(req.url);
  const network = parseTonNetwork(url.searchParams.get('network'));
  const limit = parseTonIndexerLimit(url.searchParams.get('limit'));

  const db = getDb();
  const targets = await db
    .select({ walletAddress: schema.users.walletAddress })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(TON_INDEXER_JOB_PROBE.usersLimit);

  const uniq = new Set<string>();
  const addresses: string[] = [];
  const contractParsed = tonAddressSchema.safeParse(CET_CONTRACT_ADDRESS);
  if (contractParsed.success) {
    const a = contractParsed.data.toString();
    uniq.add(a);
    addresses.push(a);
  }
  for (const t of targets) {
    const raw = (t.walletAddress ?? '').trim();
    if (!raw) continue;
    const parsed = tonAddressSchema.safeParse(raw);
    if (!parsed.success) continue;
    const a = parsed.data.toString();
    if (uniq.has(a)) continue;
    uniq.add(a);
    addresses.push(a);
    if (addresses.length >= TON_INDEXER_JOB_PROBE.maxAddresses) break;
  }

  let inserted = 0;
  let processed = 0;
  for (const address of addresses) {
    processed += 1;
    const r = await upsertTonIndexerEventsForAddress({ network, address, limit });
    if (r.ok) inserted += r.inserted;
  }

  return corsJson(req, 200, { ok: true, network, processed, inserted });
}