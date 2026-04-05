import { CET_JETTON_MASTER_ADDRESS } from '../constants/token';

/**
 * Solaris CET jetton master contract on TON mainnet.
 * Single source for app shell, API prompts, and on-chain verification links.
 */
export const CET_CONTRACT_ADDRESS = CET_JETTON_MASTER_ADDRESS;

export const TONSCAN_CET_CONTRACT_URL =
  `https://tonscan.org/address/${CET_CONTRACT_ADDRESS}` as const;

/** Public block explorer (alternate UI to Tonscan) — standard for TON wallet UIs. */
export const TONVIEWER_CET_URL = `https://tonviewer.com/${CET_CONTRACT_ADDRESS}` as const;

/** DEX aggregator search by jetton master (pair coverage varies by chain). */
export const DEXSCREENER_CET_SEARCH_URL =
  `https://dexscreener.com/search?q=${encodeURIComponent(CET_CONTRACT_ADDRESS)}` as const;

/** Aggregator search until a stable /coins/ slug exists for CET. */
export const COINGECKO_SEARCH_CET_URL =
  `https://www.coingecko.com/en/search?query=${encodeURIComponent('Solaris CET')}` as const;

export const COINMARKETCAP_SEARCH_CET_URL =
  `https://coinmarketcap.com/search/?q=${encodeURIComponent('Solaris CET')}` as const;
