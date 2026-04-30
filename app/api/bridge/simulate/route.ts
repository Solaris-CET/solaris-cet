import crypto from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { BRIDGE_SIM_LIMITS as LIMITS, computeFeeMicro, microToCET, parseCETToMicro } from '../../../src/lib/bridgeMath';
import { requireUser } from '../../lib/authUser';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions, readJson } from '../../lib/http';

export const config = { runtime: 'nodejs' };

type BridgeDirection = 'wrap' | 'unwrap';
type BridgeChain = 'TON' | 'BSC_TESTNET';

type BridgeMeta = {
  kind: 'bridge_sim';
  version: 1;
  asset: 'CET';
  direction: BridgeDirection;
  fromChain: BridgeChain;
  toChain: BridgeChain;
  tonAddress: string;
  evmAddress: string | null;
  amountMicro: string;
  feeMicro: string;
  netMicro: string;
  srcTxHash: string | null;
  dstTxHash: string | null;
  sim: {
    createdAt: string;
    startedAt: string | null;
    confirmedAt: string | null;
    etaMs: number;
  };
};

function parseDirection(v: unknown): BridgeDirection | null {
  if (v === 'wrap' || v === 'unwrap') return v;
  return null;
}

function parseEvmAddress(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(s)) return null;
  return s;
}

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function nowIso() {
  return new Date().toISOString();
}

function isBridgeMeta(v: unknown): v is BridgeMeta {
  if (!v || typeof v !== 'object') return false;
  const o = v as Partial<BridgeMeta>;
  return o.kind === 'bridge_sim' && o.version === 1 && o.asset === 'CET' && (o.direction === 'wrap' || o.direction === 'unwrap');
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, POST, OPTIONS');

  const user = await requireUser(req);
  if (!user) return corsJson(req, 401, { error: 'Unauthorized' });

  const db = getDb();

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      return corsJson(req, 400, { error: 'Invalid JSON' });
    }

    const direction = parseDirection((body as { direction?: unknown })?.direction);
    const amountMicro = parseCETToMicro((body as { amountCET?: unknown })?.amountCET);
    const evmAddress = parseEvmAddress((body as { evmAddress?: unknown })?.evmAddress);
    if (!direction) return corsJson(req, 400, { error: 'Invalid direction' });
    if (amountMicro === null || amountMicro <= 0n) return corsJson(req, 400, { error: 'Invalid amount' });

    const amountCET = microToCET(amountMicro);
    if (amountCET < LIMITS.minCET || amountCET > LIMITS.maxCET) {
      return corsJson(req, 400, { error: 'Amount out of bounds', limits: LIMITS });
    }

    const feeMicro = computeFeeMicro(amountMicro);
    if (feeMicro >= amountMicro) return corsJson(req, 400, { error: 'Amount too small after fee' });
    const netMicro = amountMicro - feeMicro;

    const fromChain: BridgeChain = direction === 'wrap' ? 'TON' : 'BSC_TESTNET';
    const toChain: BridgeChain = direction === 'wrap' ? 'BSC_TESTNET' : 'TON';

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
    .limit(100);

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
