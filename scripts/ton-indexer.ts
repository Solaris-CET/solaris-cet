/**
 * ton-indexer.ts
 *
 * Zero-cost decentralized indexer for Solaris CET token and DeDust LP pool.
 * Runs as a GitHub Actions scheduled job (every hour) and writes the result
 * to `app/public/api/state.json` which is then committed to the repository,
 * creating a free, infinitely scalable static API.
 *
 * Usage:
 *   npx tsx ton-indexer.ts
 *
 * Environment variables (optional):
 *   TON_RPC_ENDPOINT  – TON HTTP API endpoint (default: public toncenter.com)
 */

import { TonClient, Address } from '@ton/ton';
import { Factory, MAINNET_FACTORY_ADDR, PoolType, Asset, JettonRoot } from '@dedust/sdk';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CET_CONTRACT_ADDRESS } from '../app/src/lib/cetContract';
import { USDT_JETTON_MASTER_ADDRESS } from '../app/src/lib/usdtContract';
import { DEDUST_POOL_ADDRESS } from '../app/src/lib/dedustUrls';
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS } from '../app/src/constants/token';

// ── Constants ────────────────────────────────────────────────────────────────

const TON_ENDPOINT = process.env['TON_RPC_ENDPOINT'] ?? 'https://toncenter.com/api/v2/jsonRPC';
const TON_API_KEY =
  process.env['TON_RPC_API_KEY'] ?? process.env['TONCENTER_API_KEY'] ?? process.env['TON_API_KEY'] ?? undefined;

// ── TON client setup ─────────────────────────────────────────────────────────

const client = new TonClient({ endpoint: TON_ENDPOINT, apiKey: TON_API_KEY && TON_API_KEY.length > 0 ? TON_API_KEY : undefined });

// ── Output schema ─────────────────────────────────────────────────────────────

interface TokenState {
  symbol: string;
  name: string;
  contract: string;
  totalSupply: string | null;
  decimals: number;
}

interface PoolState {
  address: string;
  type?: 'volatile' | 'stable' | null;
  reserveTon: string | null;
  reserveCet: string | null;
  assets?: string[] | null;
  reserves?: string[] | null;
  lpSupply: string | null;
  priceTonPerCet: string | null;
}

interface IndexerOutput {
  token: TokenState;
  pool: PoolState;
  updatedAt: string;
}

type YieldPoint = {
  ts: string;
  tvlUsd: number;
  volume24hUsd: number;
  cetPriceUsd: number;
  tonPriceUsd: number;
};

type DeDustAsset = { type: 'native' | 'jetton'; address?: string };
type DeDustPool = {
  address: string;
  assets: [DeDustAsset, DeDustAsset];
  reserves: [string, string];
  stats?: { volume_24h?: string };
};
type DeDustPrice = { address: string; price: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function bigintToDecimalString(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (const delayMs of [0, 800, 1600, 2600]) {
    if (delayMs) await sleep(delayMs);
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String((err as any)?.message ?? err);
      const status = (err as any)?.response?.status ?? (err as any)?.status ?? null;
      const body = (err as any)?.response?.data ?? null;
      const isRateLimited = status === 429 || msg.toLowerCase().includes('ratelimit') || String(body).includes('429');
      if (!isRateLimited) break;
      console.warn(`[ton-indexer] ${label} rate-limited, retrying…`);
    }
  }
  throw lastErr;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    const raw = readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function fetchYieldPoint(): Promise<YieldPoint | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const [poolsRes, pricesRes] = await Promise.all([
      fetch('https://api.dedust.io/v2/pools', { signal: controller.signal }),
      fetch('https://api.dedust.io/v2/prices', { signal: controller.signal }),
    ]);
    if (!poolsRes.ok || !pricesRes.ok) return null;
    const pools = (await poolsRes.json()) as DeDustPool[];
    const prices = (await pricesRes.json()) as DeDustPrice[];

    const tonEntry = prices.find((p) => p.address === 'native');
    const tonPriceUsd = tonEntry ? Number.parseFloat(tonEntry.price) : Number.NaN;
    if (!Number.isFinite(tonPriceUsd) || tonPriceUsd <= 0) return null;

    const cetAddressLower = CET_CONTRACT_ADDRESS.toLowerCase();
    const cetEntry = prices.find((p) => p.address.toLowerCase() === cetAddressLower);
    const cetPriceUsdRaw = cetEntry ? Number.parseFloat(cetEntry.price) : Number.NaN;

    const pool = pools.find((p) => p.address === DEDUST_POOL_ADDRESS);
    if (!pool) return null;

    const tonIndex = pool.assets[0].type === 'native' ? 0 : 1;
    const cetIndex = tonIndex === 0 ? 1 : 0;
    const tonReserve = Number.parseFloat(pool.reserves[tonIndex]) / 1e9;
    const cetReserve = Number.parseFloat(pool.reserves[cetIndex]) / Math.pow(10, TOKEN_DECIMALS);

    const cetPriceUsd = Number.isFinite(cetPriceUsdRaw) && cetPriceUsdRaw > 0
      ? cetPriceUsdRaw
      : cetReserve > 0
        ? (tonReserve / cetReserve) * tonPriceUsd
        : Number.NaN;
    if (!Number.isFinite(cetPriceUsd) || cetPriceUsd <= 0) return null;

    const tvlUsd = tonReserve * tonPriceUsd * 2;
    const volume24hTon = pool.stats?.volume_24h ? Number.parseFloat(pool.stats.volume_24h) / 1e9 : Number.NaN;
    const volume24hUsd = Number.isFinite(volume24hTon) && volume24hTon > 0 ? volume24hTon * tonPriceUsd : 0;

    return {
      ts: new Date().toISOString(),
      tvlUsd,
      volume24hUsd,
      cetPriceUsd,
      tonPriceUsd,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('[ton-indexer] Starting Solaris CET indexer…');

  const cetAddress = Address.parse(CET_CONTRACT_ADDRESS);

  // ── 1. Query CET jetton master for total supply ───────────────────────────
  let totalSupply: bigint | null = null;
  const symbol  = TOKEN_SYMBOL;
  const name    = TOKEN_NAME;
  const decimals = TOKEN_DECIMALS;

  try {
    const jettonRoot = client.open(JettonRoot.createFromAddress(cetAddress));
    const jettonData = await retry(() => jettonRoot.getJettonData(), 'getJettonData');
    totalSupply = jettonData.totalSupply;
    console.log(`[ton-indexer] CET total supply: ${totalSupply}`);
  } catch (err) {
    console.warn('[ton-indexer] Failed to fetch jetton data:', err);
  }

  // ── 2. Query DeDust pool for reserves ─────────────────────────────────────
  let reserveTon: bigint | null = null;
  let reserveCet: bigint | null = null;
  let priceTonPerCet: string | null = null;
  let poolAddress: string | null = null;
  let poolType: 'volatile' | 'stable' | null = null;
  let poolAssets: string[] | null = null;
  let poolReservesReadable: string[] | null = null;

  try {
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const tonAsset = Asset.native();
    const cetAsset = Asset.jetton(cetAddress);
    const usdtAddress = Address.parse(USDT_JETTON_MASTER_ADDRESS);
    const usdtAsset = Asset.jetton(usdtAddress);

    const tryGetPool = async (type: PoolType, assets: [Asset, Asset]) => {
      const p = client.open(await retry(() => factory.getPool(type, assets), 'factory.getPool'));
      const [r0, r1] = await retry(() => p.getReserves(), 'pool.getReserves');
      return { pool: p, reserves: [r0, r1] as const };
    };

    let mode: 'usdt' | 'ton' | null = null;
    let r0: bigint;
    let r1: bigint;

    try {
      const stable = await tryGetPool(PoolType.STABLE, [usdtAsset, cetAsset]);
      poolAddress = stable.pool.address.toString();
      [r0, r1] = stable.reserves;
      mode = 'usdt';
    } catch {
      try {
        const vol = await tryGetPool(PoolType.VOLATILE, [usdtAsset, cetAsset]);
        poolAddress = vol.pool.address.toString();
        [r0, r1] = vol.reserves;
        mode = 'usdt';
      } catch {
        const tonVol = await tryGetPool(PoolType.VOLATILE, [tonAsset, cetAsset]);
        poolAddress = tonVol.pool.address.toString();
        [r0, r1] = tonVol.reserves;
        mode = 'ton';
      }
    }

    const reserveCetLocal = r1;
    reserveCet = reserveCetLocal;

    if (mode === 'usdt') {
      const reserveUsdt = r0;
      reserveTon = null;
      poolAssets = [`jetton:${USDT_JETTON_MASTER_ADDRESS}`, `jetton:${CET_CONTRACT_ADDRESS}`];
      poolReservesReadable = [
        bigintToDecimalString(reserveUsdt, 6),
        bigintToDecimalString(reserveCetLocal, decimals),
      ];
      console.log(`[ton-indexer] Pool reserves — USDT: ${reserveUsdt}, CET: ${reserveCetLocal}`);
    } else if (mode === 'ton') {
      const reserveTonLocal = r0;
      reserveTon = reserveTonLocal;
      poolAssets = ['native', `jetton:${CET_CONTRACT_ADDRESS}`];
      poolReservesReadable = [
        bigintToDecimalString(reserveTonLocal, 9),
        bigintToDecimalString(reserveCetLocal, decimals),
      ];
      if (reserveCetLocal > 0n) {
        const priceFraction = (reserveTonLocal * BigInt(10 ** decimals)) / reserveCetLocal;
        priceTonPerCet = bigintToDecimalString(priceFraction, 9);
      }
      console.log(`[ton-indexer] Pool reserves — TON: ${reserveTonLocal}, CET: ${reserveCetLocal}`);
    }
  } catch (err) {
    console.warn('[ton-indexer] Failed to fetch DeDust pool data via SDK:', err);

    void 0;
  }

  // ── 3. Build output ────────────────────────────────────────────────────────
  const output: IndexerOutput = {
    token: {
      symbol,
      name,
      contract: CET_CONTRACT_ADDRESS,
      totalSupply: totalSupply !== null
        ? bigintToDecimalString(totalSupply, decimals)
        : null,
      decimals,
    },
    pool: {
      address: poolAddress ?? 'unknown',
      type: poolType,
      reserveTon: reserveTon !== null
        ? bigintToDecimalString(reserveTon, 9)
        : null,
      reserveCet: reserveCet !== null
        ? bigintToDecimalString(reserveCet, decimals)
        : null,
      assets: poolAssets,
      reserves: poolReservesReadable,
      lpSupply: null,
      priceTonPerCet,
    },
    updatedAt: new Date().toISOString(),
  };

  // ── 4. Write state.json ────────────────────────────────────────────────────
  const __filename = fileURLToPath(import.meta.url);
  const __dirname  = dirname(__filename);
  const outputPath = join(__dirname, '..', 'app', 'public', 'api', 'state.json');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`[ton-indexer] state.json written to ${outputPath}`);
  
  const yieldsPath = join(__dirname, '..', 'app', 'public', 'api', 'yields-history.json');
  const point = await fetchYieldPoint();
  if (point) {
    const prev = readJsonFile<YieldPoint[]>(yieldsPath, []);
    const normalized = Array.isArray(prev) ? prev : [];
    const next = normalized
      .filter((p) => p && typeof p.ts === 'string' && p.ts !== point.ts)
      .concat(point)
      .sort((a, b) => (a.ts < b.ts ? -1 : 1))
      .slice(-720);
    writeFileSync(yieldsPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
    console.log(`[ton-indexer] yields-history.json updated (${next.length} points)`);
  } else {
    console.log('[ton-indexer] yields-history skipped (upstream unavailable)');
  }

  console.log('[ton-indexer] Done.');
}

main().catch((err) => {
  console.error('[ton-indexer] Fatal error:', err);
  process.exit(1);
});
