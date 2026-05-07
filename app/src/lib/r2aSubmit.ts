import { Address, beginCell, Cell, toNano } from '@ton/core';

const JETTON_TRANSFER_OP = 0x0f8a7ea5;
const R2A_SUBMIT_OP = 0x52324101;
const CET_DECIMALS = 6n;
const CET_DECIMALS_POW = 10n ** CET_DECIMALS;

export function parseCETToNano(input: string): bigint | null {
  const s = input.trim();
  if (!s) return null;
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const whole = m[1] ?? '0';
  const frac = (m[2] ?? '').slice(0, Number(CET_DECIMALS));
  if (m[2] && m[2].length > Number(CET_DECIMALS)) return null;
  const fracPadded = frac.padEnd(Number(CET_DECIMALS), '0');
  try {
    return BigInt(whole) * CET_DECIMALS_POW + BigInt(fracPadded || '0');
  } catch {
    return null;
  }
}

export function formatCETFromNano(nano: string | bigint | null | undefined): string {
  if (nano === null || nano === undefined) return '0';
  const v = typeof nano === 'bigint' ? nano : (() => {
    try {
      return BigInt(String(nano));
    } catch {
      return 0n;
    }
  })();
  const whole = v / CET_DECIMALS_POW;
  const frac = v % CET_DECIMALS_POW;
  const fracStr = frac.toString().padStart(Number(CET_DECIMALS), '0').replace(/0+$/, '');
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export async function sha256ToBigInt(input: string): Promise<bigint> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const out = new Uint8Array(digest);
  let x = 0n;
  for (const b of out) x = (x << 8n) + BigInt(b);
  return x;
}

export async function buildR2ASubmitForwardPayloadCell(args: {
  queryId: bigint;
  submitterAddress: string;
  title: string;
  description: string;
  complexity: number;
  hours: number;
  stakeNanoCET: bigint;
}): Promise<Cell> {
  const complexity = Math.max(1, Math.min(4, Math.floor(args.complexity)));
  const hoursScaled = (() => {
    const v = Math.round(args.hours * 100);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.min(0xffffffff, Math.max(0, v));
  })();
  const title = args.title.trim();
  const description = args.description.trim();
  const contentHash = await sha256ToBigInt(
    JSON.stringify({
      v: 1,
      submitterAddress: args.submitterAddress,
      title,
      description,
      complexity,
      hoursScaled,
      stakeNanoCET: args.stakeNanoCET.toString(),
    }),
  );
  return beginCell()
    .storeUint(R2A_SUBMIT_OP, 32)
    .storeUint(args.queryId, 64)
    .storeUint(complexity, 8)
    .storeUint(hoursScaled, 32)
    .storeCoins(args.stakeNanoCET)
    .storeAddress(Address.parse(args.submitterAddress))
    .storeUint(contentHash, 256)
    .endCell();
}

export async function buildR2ASubmitForwardPayloadB64(args: {
  queryId: bigint;
  submitterAddress: string;
  title: string;
  description: string;
  complexity: number;
  hours: number;
  stakeNanoCET: bigint;
}): Promise<string> {
  const cell = await buildR2ASubmitForwardPayloadCell(args);
  return cell.toBoc().toString('base64');
}

export function buildJettonTransferB64(args: {
  queryId: bigint;
  jettonAmountNano: bigint;
  destination: string;
  responseDestination: string;
  forwardTonAmountNano?: bigint;
  forwardPayload?: Cell;
}): string {
  const forwardPayload = args.forwardPayload ?? beginCell().storeUint(0, 32).endCell();

  const cell = beginCell()
    .storeUint(JETTON_TRANSFER_OP, 32)
    .storeUint(args.queryId, 64)
    .storeCoins(args.jettonAmountNano)
    .storeAddress(Address.parse(args.destination))
    .storeAddress(Address.parse(args.responseDestination))
    .storeBit(0)
    .storeCoins(args.forwardTonAmountNano ?? toNano('0.03'))
    .storeBit(0)
    .storeSlice(forwardPayload.beginParse())
    .endCell();

  return cell.toBoc().toString('base64');
}
