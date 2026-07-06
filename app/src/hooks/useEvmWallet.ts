import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BSC_TESTNET } from '@/constants/evm';

type ProviderKind = 'metamask' | 'walletconnect';

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  disconnect?: () => Promise<void>;
};

function getInjectedProvider(): Eip1193Provider | null {
  const w = window as unknown as { ethereum?: Eip1193Provider };
  return w.ethereum ?? null;
}

function parseHexChainId(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  if (!v.startsWith('0x')) return null;
  try {
    return Number(BigInt(v));
  } catch {
    return null;
  }
}

function isHexAddress(v: unknown): v is string {
  return typeof v === 'string' && /^0x[a-fA-F0-9]{40}$/.test(v);
}

export function useEvmWallet() {
  const [kind, setKind] = useState<ProviderKind | null>(null);
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<Eip1193Provider | null>(null);
  const wcProviderRef = useRef<Eip1193Provider | null>(null);

  const connected = Boolean(address);

  const connectMetaMask = useCallback(async () => {
    setError(null);
    const p = getInjectedProvider();
    if (!p) {
      setError('MetaMask not detected');
      return;
    }
    providerRef.current = p;
    setProvider(p);
    setKind('metamask');
    const accounts = (await p.request({ method: 'eth_requestAccounts' })) as unknown;
    const a = Array.isArray(accounts) ? accounts[0] : null;
    setAddress(isHexAddress(a) ? a : null);
    const cid = parseHexChainId(await p.request({ method: 'eth_chainId' }));
    setChainId(cid);
  }, []);

  const connectWalletConnect = useCallback(async () => {
    setError(null);
    const projectId = String(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? '').trim();
    if (!projectId) {
      setError('WalletConnect projectId missing');
      return;
    }
    const mod = await import('@walletconnect/ethereum-provider');
    const EthereumProvider = (mod as unknown as { default: { init: (opts: unknown) => Promise<Eip1193Provider> } }).default;
    const wc = await EthereumProvider.init({
      projectId,
      showQrModal: true,
      chains: [BSC_TESTNET.chainId],
      optionalChains: [BSC_TESTNET.chainId],
      rpcMap: { [BSC_TESTNET.chainId]: BSC_TESTNET.rpcUrl },
    });
    wcProviderRef.current = wc;
    providerRef.current = wc;
    setProvider(wc);
    setKind('walletconnect');
    const accounts = (await wc.request({ method: 'eth_requestAccounts' })) as unknown;
    const a = Array.isArray(accounts) ? accounts[0] : null;
    setAddress(isHexAddress(a) ? a : null);
    const cid = parseHexChainId(await wc.request({ method: 'eth_chainId' }));
    setChainId(cid);
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    setAddress(null);
    setChainId(null);
    setKind(null);
    setProvider(null);
    try {
      await wcProviderRef.current?.disconnect?.();
    } catch {
      void 0;
    } finally {
      providerRef.current = null;
      wcProviderRef.current = null;
    }
  }, []);

  const ensureBscTestnet = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return false;
    const current = parseHexChainId(await p.request({ method: 'eth_chainId' }));
    if (current === BSC_TESTNET.chainId) {
      setChainId(current);
      return true;
    }
    try {
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BSC_TESTNET.chainId.toString(16)}` }],
      });
      setChainId(BSC_TESTNET.chainId);
      return true;
    } catch {
      try {
        await p.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${BSC_TESTNET.chainId.toString(16)}`,
              chainName: BSC_TESTNET.name,
              rpcUrls: [BSC_TESTNET.rpcUrl],
              nativeCurrency: BSC_TESTNET.nativeCurrency,
              blockExplorerUrls: [BSC_TESTNET.blockExplorerUrl],
            },
          ],
        });
        setChainId(BSC_TESTNET.chainId);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  useEffect(() => {
    const p = getInjectedProvider();
    if (!p?.on || !p.removeListener) return;

    const onAccountsChanged = (accounts: unknown) => {
      const a = Array.isArray(accounts) ? accounts[0] : null;
      setAddress(isHexAddress(a) ? a : null);
    };
    const onChainChanged = (cid: unknown) => {
      setChainId(parseHexChainId(cid));
    };
    p.on('accountsChanged', onAccountsChanged);
    p.on('chainChanged', onChainChanged);
    return () => {
      p.removeListener?.('accountsChanged', onAccountsChanged);
      p.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }, [address]);

  return {
    kind,
    provider,
    address,
    displayAddress,
    chainId,
    connected,
    error,
    connectMetaMask,
    connectWalletConnect,
    disconnect,
    ensureBscTestnet,
  };
}
