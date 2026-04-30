export type EvmChain = {
  key: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export const BSC_TESTNET: EvmChain = {
  key: 'bsc_testnet',
  name: 'BNB Smart Chain Testnet',
  chainId: 97,
  rpcUrl: import.meta.env.VITE_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  blockExplorerUrl: 'https://testnet.bscscan.com',
  nativeCurrency: { name: 'Test BNB', symbol: 'tBNB', decimals: 18 },
};

