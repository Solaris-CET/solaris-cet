/**
 * DeDust pool identifiers for CET on TON mainnet.
 * Single source of truth for swap / pool / deposit URLs in the app shell.
 */
export const DEDUST_POOL_ADDRESS =
  'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB' as const;

export const DEDUST_SWAP_URL = `https://dedust.io/swap/TON/${DEDUST_POOL_ADDRESS}` as const;

export const DEDUST_POOL_PAGE_URL = `https://dedust.io/pools/${DEDUST_POOL_ADDRESS}` as const;

export const DEDUST_POOL_DEPOSIT_URL = `${DEDUST_POOL_PAGE_URL}/deposit` as const;
