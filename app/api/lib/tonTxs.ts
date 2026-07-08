import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from './tonapi';

export const TON_TXS_PATH = '/api/ton/txs';
export const TON_TXS_METHODS = 'GET, OPTIONS';

export const TON_TXS_PROBE = {
  path: TON_TXS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  queryParams: ['address', 'network', 'type', 'limit', 'beforeLt', 'before_lt', 'cursor'] as const,
  rateLimitKey: 'ton-txs' as const,
  rateLimit: 120,
  rateWindowSeconds: 60,
  fetchTimeoutMs: 6500,
  defaultLimit: 20,
  maxLimit: 50,
  cacheControl: 'no-store' as const,
};

export function asTonTxString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

export function asTonTxDigitsString(v: unknown): string {
  const s = asTonTxString(v).trim();
  return /^\d+$/.test(s) ? s : '';
}

export function parseTonTxsLimit(raw: string): number {
  const n = Number.parseInt(raw || String(TON_TXS_PROBE.defaultLimit), 10);
  if (!Number.isFinite(n) || n <= 0) return TON_TXS_PROBE.defaultLimit;
  return Math.min(TON_TXS_PROBE.maxLimit, Math.max(1, n));
}

export function resolveTonTxsBeforeLt(url: URL): string {
  const beforeLtRaw = (url.searchParams.get('beforeLt') ?? url.searchParams.get('before_lt') ?? url.searchParams.get('cursor') ?? '').trim();
  return asTonTxDigitsString(beforeLtRaw);
}

export type TonTxItem = {
  hash: string;
  now: string;
  type: string;
  lt: string;
};

export function mapTonTxEvent(e: Record<string, unknown>): TonTxItem | null {
  const hash = asTonTxString(e.event_id) || asTonTxString(e.tx_hash) || asTonTxString(e.hash);
  const now = asTonTxString(e.timestamp) || asTonTxString(e.time) || '';
  const lt = asTonTxDigitsString(e.lt) || asTonTxDigitsString(e.transaction_lt) || asTonTxDigitsString(e.logical_time);
  const actions = Array.isArray(e.actions) ? (e.actions as unknown[]) : [];
  const firstAction = actions[0] && typeof actions[0] === 'object' ? (actions[0] as Record<string, unknown>) : null;
  const actionType = firstAction ? asTonTxString(firstAction.type) : '';
  const inferredType = actionType ? actionType.toLowerCase() : '';
  const kind = inferredType.includes('transfer') ? 'transfer' : inferredType ? 'contract' : 'contract';
  if (!hash) return null;
  return { hash, now, type: kind, lt };
}

export function extractTonTxRawEvents(data: Record<string, unknown>): unknown[] {
  return (
    (Array.isArray(data.events) && data.events) ||
    (Array.isArray(data.items) && data.items) ||
    []
  );
}

export function filterTonTxItemsByType(items: TonTxItem[], type: string): TonTxItem[] {
  return type === 'all' ? items : items.filter((it) => it.type === type);
}

export async function fetchTonTxEvents(
  address: string,
  networkRaw: string | null,
  limit: number,
  beforeLt: string,
  type: string,
): Promise<{ ok: true; address: string; network: TonNetwork; items: TonTxItem[]; nextCursor: string | null } | { ok: false }> {
  const network = parseTonNetwork(networkRaw);
  const r = await fetchTonapiJson<Record<string, unknown>>(
    network,
    `/v2/accounts/${encodeURIComponent(address)}/events?limit=${encodeURIComponent(String(limit))}${beforeLt ? `&before_lt=${encodeURIComponent(beforeLt)}` : ''}`,
    { timeoutMs: TON_TXS_PROBE.fetchTimeoutMs },
  );
  if (!r.ok) return { ok: false };

  const items = extractTonTxRawEvents(r.data)
    .map((e): Record<string, unknown> | null => (e && typeof e === 'object' ? (e as Record<string, unknown>) : null))
    .filter((e): e is Record<string, unknown> => Boolean(e))
    .map(mapTonTxEvent)
    .filter((it): it is TonTxItem => Boolean(it));

  const filtered = filterTonTxItemsByType(items, type);
  const nextCursor = filtered.length ? asTonTxDigitsString(filtered[filtered.length - 1]?.lt) : '';
  return { ok: true, address, network, items: filtered, nextCursor: nextCursor || null };
}