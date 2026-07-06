/**
 * DeDust pool identifiers for CET on TON mainnet.
 * Single source of truth for swap / pool / deposit URLs in the app shell.
 */
import { CET_CONTRACT_ADDRESS } from './cetContract';

export const DEDUST_POOL_ADDRESS =
  'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB' as const;

export const DEDUST_COIN_PAGE_URL = `https://dedust.io/coins/${CET_CONTRACT_ADDRESS}` as const;

export const DEDUST_SWAP_URL = DEDUST_COIN_PAGE_URL;

export const DEDUST_POOL_PAGE_URL = DEDUST_COIN_PAGE_URL;

export const DEDUST_POOL_DEPOSIT_URL = DEDUST_COIN_PAGE_URL;
