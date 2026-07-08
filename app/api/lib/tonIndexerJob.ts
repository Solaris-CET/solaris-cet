import { getDb, schema } from '@/db/client';
import { fetchTonapiJson } from './tonapi';

export const TON_INDEXER_JOB_PATH = '/api/jobs/ton-indexer';
export const TON_INDEXER_JOB_METHODS = 'POST, OPTIONS';

export const TON_INDEXER_JOB_PROBE = {
  path: TON_INDEXER_JOB_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  cronAuthRequired: true,
  defaultLimit: 30,
  minLimit: 5,
  maxLimit: 50,
  usersLimit: 200,
  maxAddresses: 60,
  fetchTimeoutMs: 6500,
};

export type TonIndexerEvent = Record<string, unknown>;

export function tonIndexerAsString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export function extractTonIndexerEventKind(event: TonIndexerEvent): string {
  const actions = Array.isArray(event.actions) ? (event.actions as unknown[]) : [];
  const first = actions[0] && typeof actions[0] === 'object' ? (actions[0] as Record<string, unknown>) : null;
  const t = first ? tonIndexerAsString(first.type).toLowerCase() : '';
  if (!t) return 'contract';
  if (t.includes('transfer')) return 'transfer';
  return 'contract';
}

export function extractTonIndexerEventHash(event: TonIndexerEvent): string {
  return tonIndexerAsString(event.event_id) || tonIndexerAsString(event.tx_hash) || tonIndexerAsString(event.hash);
}

export function extractTonIndexerEventTimestampIso(event: TonIndexerEvent): string {
  const raw = tonIndexerAsString(event.timestamp) || tonIndexerAsString(event.time) || '';
  if (!raw) return '';
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      const ms = raw.length >= 13 ? n : n * 1000;
      return new Date(ms).toISOString();
    }
  }
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return '';
}

export function parseTonIndexerLimit(raw: string | null): number {
  const n = Number(raw ?? TON_INDEXER_JOB_PROBE.defaultLimit);
  if (!Number.isFinite(n)) return TON_INDEXER_JOB_PROBE.defaultLimit;
  return Math.max(TON_INDEXER_JOB_PROBE.minLimit, Math.min(TON_INDEXER_JOB_PROBE.maxLimit, Math.floor(n)));
}

export async function upsertTonIndexerEventsForAddress(params: {
  network: 'mainnet' | 'testnet';
  address: string;
  limit: number;
}): Promise<{ ok: true; inserted: number } | { ok: false; inserted: number }> {
  const db = getDb();
  const r = await fetchTonapiJson<Record<string, unknown>>(
    params.network,
    `/v2/accounts/${encodeURIComponent(params.address)}/events?limit=${params.limit}`,
    { timeoutMs: TON_INDEXER_JOB_PROBE.fetchTimeoutMs },
  );
  if (!r.ok) return { ok: false, inserted: 0 };

  const rawEvents =
    (Array.isArray((r.data as { events?: unknown }).events) && (r.data as { events: unknown[] }).events) ||
    (Array.isArray((r.data as { items?: unknown }).items) && (r.data as { items: unknown[] }).items) ||
    [];

  let inserted = 0;
  for (const e0 of rawEvents) {
    if (!e0 || typeof e0 !== 'object') continue;
    const e = e0 as TonIndexerEvent;
    const txHash = extractTonIndexerEventHash(e);
    if (!txHash) continue;
    const occurredAtIso = extractTonIndexerEventTimestampIso(e);
    if (!occurredAtIso) continue;
    const kind = extractTonIndexerEventKind(e);

    const res = await db
      .insert(schema.tonIndexedTransactions)
      .values({
        network: params.network,
        address: params.address,
        txHash,
        kind,
        occurredAt: new Date(occurredAtIso),
        raw: e,
      })
      .onConflictDoNothing();

    inserted += Array.isArray(res) ? res.length : 0;
  }

  return { ok: true, inserted };
}