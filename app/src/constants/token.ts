/**
 * Global CET token constants.
 * Centralized source of truth for on-chain data and UI formatting.
 */

export const TOKEN_NAME = "Solaris CET" as const;
export const TOKEN_SYMBOL = "CET" as const;

/** Jetton Master Address on TON Mainnet */
export const CET_JETTON_MASTER_ADDRESS = "EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX" as const;

/** 
 * Decimals used by the CET Jetton.
 * nanoCET = CET * 10^DECIMALS
 */
export const TOKEN_DECIMALS = 6 as const;

/** Immutable hard cap */
export const TOKEN_TOTAL_SUPPLY = 9000 as const;

/** Helper for nano-unit conversion */
export const TOKEN_DECIMALS_POW = Math.pow(10, TOKEN_DECIMALS);

/**
 * Format raw nanoCET units to human-readable number.
 */
export function fromNanoCET(nanoUnits: string | number | bigint | null | undefined): number {
  if (nanoUnits === null || nanoUnits === undefined) return 0;
  return Number(nanoUnits) / TOKEN_DECIMALS_POW;
}

/**
 * Format CET to raw nanoCET units (string for high precision).
 */
export function toNanoCET(units: number): string {
  return (BigInt(Math.floor(units * TOKEN_DECIMALS_POW))).toString();
}
