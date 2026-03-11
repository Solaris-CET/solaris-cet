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

// ── Constants ────────────────────────────────────────────────────────────────

const CET_CONTRACT = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
const DEDUST_POOL  = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
const TON_ENDPOINT = process.env['TON_RPC_ENDPOINT'] ?? 'https://toncenter.com/api/v2/jsonRPC';

// Number of nano-units per whole token (both TON and CET use 9 decimals)
const NANO = 1_000_000_000n;

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

  const cetAddress = Address.parse(CET_CONTRACT);

  // ── 1. Query CET jetton master for total supply ───────────────────────────
  let totalSupply: bigint | null = null;
  const symbol  = 'CET';
  const name    = 'SOLARIS CET';
  const decimals = 9;

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

  try {
    const factory = client.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

    const tonAsset = Asset.native();
    const cetAsset = Asset.jetton(cetAddress);

    const pool = client.open(
      await factory.getPool(PoolType.VOLATILE, [tonAsset, cetAsset])
    );

    const [r0, r1] = await pool.getReserves();
    // reserves are [TON, CET] because assets were ordered [native, jetton]
    reserveTon = r0;
    reserveCet = r1;

    if (reserveTon !== null && reserveCet !== null && reserveCet > 0n) {
      const priceFraction = (reserveTon * NANO) / reserveCet;
      priceTonPerCet = bigintToDecimalString(priceFraction, 9);
    }

    console.log(`[ton-indexer] Pool reserves — TON: ${reserveTon}, CET: ${reserveCet}`);
  } catch (err) {
    console.warn('[ton-indexer] Failed to fetch DeDust pool data via SDK:', err);

    // Graceful fallback: query DeDust REST API
    try {
      const res = await fetch(`https://api.dedust.io/v2/pools/${DEDUST_POOL}`);
      if (res.ok) {
        const json = await res.json() as {
          reserves?: [string, string];
        };
        if (Array.isArray(json.reserves)) {
          reserveTon = BigInt(json.reserves[0]);
          reserveCet = BigInt(json.reserves[1]);
          if (reserveTon !== null && reserveCet > 0n) {
            const priceFraction = (reserveTon * NANO) / reserveCet;
            priceTonPerCet = bigintToDecimalString(priceFraction, 9);
          }
        }
        console.log('[ton-indexer] Fallback DeDust REST API success');
      }
    } catch (fallbackErr) {
      console.warn('[ton-indexer] DeDust REST fallback also failed:', fallbackErr);
    }
  }

  // ── 3. Build output ────────────────────────────────────────────────────────
  const output: IndexerOutput = {
    token: {
      symbol,
      name,
      contract: CET_CONTRACT,
      totalSupply: totalSupply !== null
        ? bigintToDecimalString(totalSupply, decimals)
        : null,
      decimals,
    },
    pool: {
      address: DEDUST_POOL,
      reserveTon: reserveTon !== null
        ? bigintToDecimalString(reserveTon, 9)
        : null,
      reserveCet: reserveCet !== null
        ? bigintToDecimalString(reserveCet, decimals)
        : null,
      lpSupply: null,
      priceTonPerCet: priceTonPerCet,
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
