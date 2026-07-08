import { fetchTonapiJson, parseTonNetwork, type TonNetwork } from './tonapi';

export const TON_NFTS_PATH = '/api/ton/nfts';
export const TON_NFTS_METHODS = 'GET, OPTIONS';

export const TON_NFTS_PROBE = {
  path: TON_NFTS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  runtime: 'edge' as const,
  queryParams: ['owner', 'network'] as const,
  rateLimitKey: 'ton-nfts' as const,
  rateLimit: 90,
  rateWindowSeconds: 60,
  fetchTimeoutMs: 6500,
  tonapiLimit: 200,
  cacheControl: 'no-store' as const,
};

export type TonNftItem = {
  address: string;
  name?: string;
  image?: string;
  collectionAddress?: string;
  collectionName?: string;
};

export function mapTonNftItem(it: Record<string, unknown>): TonNftItem | null {
  const address = typeof it.address === 'string' ? it.address : '';
  const meta = it.metadata && typeof it.metadata === 'object' ? (it.metadata as Record<string, unknown>) : null;
  const name = meta && typeof meta.name === 'string' ? meta.name : typeof it.name === 'string' ? it.name : undefined;
  const image = meta && typeof meta.image === 'string' ? meta.image : undefined;
  const collection = it.collection && typeof it.collection === 'object' ? (it.collection as Record<string, unknown>) : null;
  const collectionAddress = collection && typeof collection.address === 'string' ? collection.address : undefined;
  const collectionNameMeta =
    collection && collection.metadata && typeof collection.metadata === 'object'
      ? (collection.metadata as Record<string, unknown>)
      : null;
  const collectionName =
    collectionNameMeta && typeof collectionNameMeta.name === 'string' ? collectionNameMeta.name : undefined;
  if (!address.trim()) return null;
  return { address, name, image, collectionAddress, collectionName };
}

export function extractTonNftRawItems(data: Record<string, unknown>): unknown[] {
  return (
    (Array.isArray(data.nft_items) && data.nft_items) ||
    (Array.isArray(data.items) && data.items) ||
    []
  );
}

export async function fetchTonNftsForOwner(
  owner: string,
  networkRaw: string | null,
): Promise<{ ok: true; owner: string; network: TonNetwork; items: TonNftItem[] } | { ok: false }> {
  const network = parseTonNetwork(networkRaw);
  const r = await fetchTonapiJson<Record<string, unknown>>(
    network,
    `/v2/accounts/${encodeURIComponent(owner)}/nfts?limit=${TON_NFTS_PROBE.tonapiLimit}&offset=0&indirect_ownership=false`,
    { timeoutMs: TON_NFTS_PROBE.fetchTimeoutMs },
  );
  if (!r.ok) return { ok: false };

  const items = extractTonNftRawItems(r.data)
    .map((it): Record<string, unknown> | null => (it && typeof it === 'object' ? (it as Record<string, unknown>) : null))
    .filter((it): it is Record<string, unknown> => Boolean(it))
    .map(mapTonNftItem)
    .filter((it): it is TonNftItem => Boolean(it));

  return { ok: true, owner, network, items };
}