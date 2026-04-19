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
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CET_CONTRACT_ADDRESS } from '../app/src/lib/cetContract';
import { USDT_JETTON_MASTER_ADDRESS } from '../app/src/lib/usdtContract';
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS } from '../app/src/constants/token';

// ── Constants ────────────────────────────────────────────────────────────────

const TON_ENDPOINT = process.env['TON_RPC_ENDPOINT'] ?? 'https://toncenter.com/api/v2/jsonRPC';

// ── TON client setup ─────────────────────────────────────────────────────────

const client = new TonClient({ endpoint: TON_ENDPOINT });

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function bigintToDecimalString(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const frac = value % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole}.${fracStr}` : `${whole}`;
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
    const jettonData = await jettonRoot.getJettonData();
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
  let poolAssets: string[] | null = null;
  let poolReservesReadable: string[] | null = null;

  try {
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const cetAsset = Asset.jetton(cetAddress);
    const usdtAddress = Address.parse(USDT_JETTON_MASTER_ADDRESS);
    const usdtAsset = Asset.jetton(usdtAddress);

    const pool = client.open(
      await factory.getPool(PoolType.VOLATILE, [usdtAsset, cetAsset])
    );

    poolAddress = pool.address.toString();

    const [r0, r1] = await pool.getReserves();
    // reserves are aligned with requested asset order: [USDT, CET]
    const reserveUsdt = r0;
    reserveCet = r1;
    reserveTon = null;

    poolAssets = [`jetton:${USDT_JETTON_MASTER_ADDRESS}`, `jetton:${CET_CONTRACT_ADDRESS}`];
    poolReservesReadable = [
      bigintToDecimalString(reserveUsdt, 6),
      bigintToDecimalString(reserveCet, decimals),
    ];

    console.log(`[ton-indexer] Pool reserves — USDT: ${reserveUsdt}, CET: ${reserveCet}`);
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
  console.log('[ton-indexer] Done.');
}

main().catch((err) => {
  console.error('[ton-indexer] Fatal error:', err);
  process.exit(1);
});
