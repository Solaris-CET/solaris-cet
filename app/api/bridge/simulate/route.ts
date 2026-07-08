import crypto from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { computeFeeMicro, microToCET, parseCETToMicro } from '@/lib/bridgeMath';
import {
  BRIDGE_SIMULATE_PROBE,
  bridgeChainsForDirection,
  isBridgeMeta,
  nowIso,
  parseBridgeDirection,
  parseBridgeEvmAddress,
  type BridgeMeta,
} from '../../lib/bridgeSimulate';
import { requireUser } from '@/api/lib/authUser';
import { getAllowedOrigin } from '@/api/lib/cors';
import { corsJson, corsOptions, readJson } from '@/api/lib/http';

export { BRIDGE_SIMULATE_PATH, BRIDGE_SIMULATE_PROBE } from '@/api/lib/bridgeSimulate';

export const config = { runtime: 'nodejs' };

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, BRIDGE_SIMULATE_PROBE.methods.join(', '));

  const user = await requireUser(req);
  if (!user) return corsJson(req, BRIDGE_SIMULATE_PROBE.unauthenticatedStatus, { error: 'Unauthorized' });

  const db = getDb();
  const LIMITS = BRIDGE_SIMULATE_PROBE.limits;

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      return corsJson(req, 400, { error: BRIDGE_SIMULATE_PROBE.invalidJsonError });
    }

    const direction = parseBridgeDirection((body as { direction?: unknown })?.direction);
    const amountMicro = parseCETToMicro((body as { amountCET?: unknown })?.amountCET);
    const evmAddress = parseBridgeEvmAddress((body as { evmAddress?: unknown })?.evmAddress);
    if (!direction) return corsJson(req, 400, { error: BRIDGE_SIMULATE_PROBE.invalidDirectionError });
    if (amountMicro === null || amountMicro <= 0n) return corsJson(req, 400, { error: BRIDGE_SIMULATE_PROBE.invalidAmountError });

    const amountCET = microToCET(amountMicro);
    if (amountCET < LIMITS.minCET || amountCET > LIMITS.maxCET) {
      return corsJson(req, 400, { error: BRIDGE_SIMULATE_PROBE.amountOutOfBoundsError, limits: LIMITS });
    }

    const feeMicro = computeFeeMicro(amountMicro);
    if (feeMicro >= amountMicro) return corsJson(req, 400, { error: BRIDGE_SIMULATE_PROBE.amountTooSmallError });
    const netMicro = amountMicro - feeMicro;

    const { fromChain, toChain } = bridgeChainsForDirection(direction);

    const meta: BridgeMeta = {
      kind: 'bridge_sim',
      version: 1,
      asset: 'CET',
      direction,
      fromChain,
      toChain,
      tonAddress: user.walletAddress,
      evmAddress,
      amountMicro: amountMicro.toString(),
      feeMicro: feeMicro.toString(),
      netMicro: netMicro.toString(),
      srcTxHash: null,
      dstTxHash: null,
      sim: { createdAt: nowIso(), startedAt: null, confirmedAt: null, etaMs: LIMITS.etaMs },
    };

    const [row] = await db
      .insert(schema.web3Intents)
      .values({ userId: user.id, type: 'bridge', status: 'created', meta })
      .returning();

    return new Response(
      JSON.stringify({
        ok: true,
        id: row.id,
        limits: LIMITS,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
      },
    );
  }

  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const rows = await db
    .select()
    .from(schema.web3Intents)
    .where(and(eq(schema.web3Intents.userId, user.id), eq(schema.web3Intents.type, 'bridge')))
    .orderBy(desc(schema.web3Intents.createdAt))
    .limit(BRIDGE_SIMULATE_PROBE.listLimit);

  const now = Date.now();
  for (const r of rows) {
    if (!isBridgeMeta(r.meta)) continue;
    const meta = r.meta;
    if (r.status === 'created') {
      const srcTxHash =
        meta.direction === 'wrap' ? `ton_sim_${randomHex(20)}` : `0x${randomHex(32)}`;
      const dstTxHash =
        meta.direction === 'wrap' ? `0x${randomHex(32)}` : `ton_sim_${randomHex(20)}`;
      const updated: BridgeMeta = {
        ...meta,
        srcTxHash,
        dstTxHash,
        sim: { ...meta.sim, startedAt: nowIso() },
      };
      await db
        .update(schema.web3Intents)
        .set({ status: 'pending', providerRef: `sim-bridge:${r.id}`, txHash: srcTxHash, meta: updated })
        .where(eq(schema.web3Intents.id, r.id));
      r.status = 'pending';
      r.providerRef = `sim-bridge:${r.id}`;
      r.txHash = srcTxHash;
      r.meta = updated;
      continue;
    }

    if (r.status === 'pending') {
      const startedAt = meta.sim.startedAt ? Date.parse(meta.sim.startedAt) : 0;
      if (startedAt && now - startedAt >= meta.sim.etaMs) {
        const updated: BridgeMeta = {
          ...meta,
          sim: { ...meta.sim, confirmedAt: nowIso() },
        };
        await db
          .update(schema.web3Intents)
          .set({ status: 'confirmed', meta: updated })
          .where(eq(schema.web3Intents.id, r.id));
        r.status = 'confirmed';
        r.meta = updated;
      }
    }
  }

  let wrappedBalanceMicro = 0n;
  for (const r of rows) {
    if (r.status !== 'confirmed') continue;
    if (!isBridgeMeta(r.meta)) continue;
    const m = r.meta;
    const amountMicro = BigInt(m.amountMicro);
    const netMicro = BigInt(m.netMicro);
    if (m.direction === 'wrap') wrappedBalanceMicro += netMicro;
    if (m.direction === 'unwrap') wrappedBalanceMicro -= amountMicro;
  }
  if (wrappedBalanceMicro < 0n) wrappedBalanceMicro = 0n;

  return corsJson(req, 200, {
    ok: true,
    limits: LIMITS,
    wrappedBalanceMicro: wrappedBalanceMicro.toString(),
    transfers: rows
      .filter((r) => isBridgeMeta(r.meta))
      .map((r) => {
        const m = r.meta as BridgeMeta;
        return {
          id: r.id,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          direction: m.direction,
          fromChain: m.fromChain,
          toChain: m.toChain,
          amountMicro: m.amountMicro,
          feeMicro: m.feeMicro,
          netMicro: m.netMicro,
          tonAddress: m.tonAddress,
          evmAddress: m.evmAddress,
          srcTxHash: m.srcTxHash,
          dstTxHash: m.dstTxHash,
          providerRef: r.providerRef ?? null,
        };
      }),
  });
}