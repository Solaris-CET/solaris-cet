import { ExternalLink, LogOut, PlugZap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { BSC_TESTNET } from '@/constants/evm';
import { useEvmWallet } from '@/hooks/useEvmWallet';
import { evmRpc, hexToNumber } from '@/lib/evmRpc';

export default function EvmWalletPanel() {
  const w = useEvmWallet();
  const [health, setHealth] = useState<{ ok: boolean; block?: number; error?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const run = async () => {
      try {
        const hex = await evmRpc<string>(BSC_TESTNET.rpcUrl, 'eth_blockNumber', [], controller.signal);
        const block = hexToNumber(hex);
        if (!alive) return;
        setHealth({ ok: true, block });
      } catch (e) {
        if (!alive) return;
        setHealth({ ok: false, error: e instanceof Error ? e.message : 'unavailable' });
      }
    };
    void run();
    const id = window.setInterval(() => void run(), 20_000);
    return () => {
      alive = false;
      controller.abort();
      window.clearInterval(id);
    };
  }, []);

  const chainLabel = useMemo(() => {
    if (!w.chainId) return '—';
    return w.chainId === BSC_TESTNET.chainId ? `${BSC_TESTNET.name} (${w.chainId})` : `Chain ${w.chainId}`;
  }, [w.chainId]);

  const explorerHref = useMemo(() => {
    if (!w.address) return '';
    return `${BSC_TESTNET.blockExplorerUrl}/address/${encodeURIComponent(w.address)}`;
  }, [w.address]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <PlugZap className="h-4 w-4 text-solaris-cyan" />
          EVM Wallet (BSC testnet)
        </div>
        <div className="flex items-center gap-2">
          <span
            className={health?.ok ? 'inline-flex items-center gap-2 text-[11px] text-emerald-300' : 'inline-flex items-center gap-2 text-[11px] text-white/60'}
            title={health?.ok ? `block ${health.block}` : health?.error ?? 'unavailable'}
          >
            <span className={health?.ok ? 'h-1.5 w-1.5 rounded-full bg-emerald-400' : 'h-1.5 w-1.5 rounded-full bg-white/30'} />
            {health?.ok ? 'RPC ok' : 'RPC'}
          </span>
        </div>
      </div>

      <div className="mt-3 text-sm text-white/70 leading-relaxed">
        Address: <span className="font-mono text-white/85">{w.displayAddress ?? 'Neconectat'}</span>
        <div className="mt-1 text-xs text-white/55">Chain: <span className="font-mono">{chainLabel}</span></div>
        {w.error ? <div className="mt-2 text-xs text-rose-200/80">{w.error}</div> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!w.connected ? (
          <>
            <Button onClick={() => void w.connectMetaMask()} className="rounded-xl">
              Connect MetaMask
            </Button>
            <Button
              variant="outline"
              onClick={() => void w.connectWalletConnect()}
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              WalletConnect v2
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => void w.ensureBscTestnet()} className="rounded-xl">
              Switch to BSC testnet
            </Button>
            <Button
              variant="outline"
              onClick={() => void w.disconnect()}
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
            <a
              href={explorerHref}
              target="_blank"
              rel="noreferrer"
              className={
                w.address
                  ? 'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors'
                  : 'pointer-events-none opacity-50 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white'
              }
            >
              BscScan <ExternalLink className="h-4 w-4" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

