export type AiChatCachePayload = {
  response: string;
  sources: unknown[];
  usage?: unknown;
};

type CacheEntry = { payload: AiChatCachePayload; expiresAt: number };

const store = new Map<string, CacheEntry>();

let hits = 0;
let misses = 0;
let sets = 0;
let evictions = 0;

function nowMs(): number {
  return Date.now();
}

function getMaxEntries(): number {
  const n = Number.parseInt(process.env.CET_AI_CACHE_MAX_ENTRIES ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : 300;
}

export function getCacheTtlSeconds(): number {
  const n = Number.parseInt(process.env.CET_AI_CACHE_TTL_SECONDS ?? '', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 3600) : 20;
}

export function getAiChatCacheStats(): {
  size: number;
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
} {
  return { size: store.size, hits, misses, sets, evictions };
}

function pruneExpired(): void {
  const t = nowMs();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= t) store.delete(k);
  }
}

function ensureCapacity(): void {
  const max = getMaxEntries();
  if (store.size <= max) return;
  const overflow = store.size - max;
  for (let i = 0; i < overflow; i++) {
    const firstKey = store.keys().next().value as string | undefined;
    if (!firstKey) break;
    store.delete(firstKey);
    evictions++;
  }
}

export function getAiChatCache(key: string): AiChatCachePayload | null {
  pruneExpired();
  const entry = store.get(key);
  if (!entry) {
    misses++;
    return null;
  }
  if (entry.expiresAt <= nowMs()) {
    store.delete(key);
    misses++;
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  hits++;
  return entry.payload;
}

export function setAiChatCache(key: string, payload: AiChatCachePayload, ttlSeconds?: number): void {
  pruneExpired();
  const ttl = typeof ttlSeconds === 'number' && ttlSeconds > 0 ? ttlSeconds : getCacheTtlSeconds();
  store.set(key, { payload, expiresAt: nowMs() + ttl * 1000 });
  sets++;
  ensureCapacity();
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `fnv1a-${(h >>> 0).toString(16)}`;
  }
  const data = new TextEncoder().encode(input);
  const digest = await subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}
