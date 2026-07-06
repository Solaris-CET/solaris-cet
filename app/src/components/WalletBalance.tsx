import { useTonWallet } from '@tonconnect/ui-react';
import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { fromNanoCET, TOKEN_DECIMALS } from '@/constants/token';
import { useDataSaver } from '@/hooks/useDataSaver';
import { useDocumentHidden } from '@/hooks/useDocumentHidden';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTonNetwork } from '@/hooks/useTonNetwork';
import { readEnvelope, writeEnvelope } from '@/lib/localJsonStore';
import { cn } from '@/lib/utils';

type WalletBalanceResponse = {
  ok: boolean;
  address?: string;
  tonBalanceNano?: string;
  cetBalanceNano?: string | null;
  error?: string;
};

function formatTon(nano: string) {
  const v = BigInt(nano);
  const whole = v / 1_000_000_000n;
  const frac = v % 1_000_000_000n;
  const fracStr = frac.toString().padStart(9, '0').slice(0, 3);
  return `${whole.toString()}.${fracStr}`;
}

function formatCET(nano: string) {
  const v = fromNanoCET(nano);
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS });
}

export default function WalletBalance({ className }: { className?: string }) {
  const wallet = useTonWallet();
  const address = wallet?.account?.address?.trim() ?? null;
  const { network } = useTonNetwork();
  const [data, setData] = useState<WalletBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const online = useOnlineStatus();
  const hidden = useDocumentHidden();
  const { enabled: dataSaver } = useDataSaver();
  const cacheKey = useMemo(() => (address ? `solaris_wallet_balance:${network}:${address}` : ''), [address, network]);

  useEffect(() => {
    if (!address) return;

    let alive = true;
    const controller = new AbortController();

    const run = async () => {
      if (!online || hidden) return;
      setLoading(true);
      try {
        const preferred = await fetch(
          `/api/ton/balance?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`,
          {
          signal: controller.signal,
          cache: 'no-store',
          },
        );
        if (preferred.ok) {
          const json = (await preferred.json()) as WalletBalanceResponse;
          if (!alive) return;
          setData(json);
          if (cacheKey && json.ok) writeEnvelope(cacheKey, json);
          return;
        }

        const fallback = await fetch(
          `/api/wallet/balance?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`,
          {
          signal: controller.signal,
          cache: 'no-store',
          },
        );
        const json = (await fallback.json()) as WalletBalanceResponse;
        if (!alive) return;
        setData(json);
        if (cacheKey && json.ok) writeEnvelope(cacheKey, json);
      } catch {
        if (!alive) return;
        const cached = cacheKey ? readEnvelope<WalletBalanceResponse>(cacheKey, 1000 * 60 * 60 * 24 * 3) : null;
        setData(cached ?? { ok: false, address, error: 'unavailable' });
      } finally {
        if (alive) setLoading(false);
      }
    };

    const cached = cacheKey ? readEnvelope<WalletBalanceResponse>(cacheKey, 1000 * 60 * 60 * 24 * 3) : null;
    if (cached) setData(cached);
    const first = window.setTimeout(() => {
      void run();
    }, 0);
    const id = window.setInterval(() => {
      void run();
    }, dataSaver ? 60_000 : 20_000);
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [address, cacheKey, dataSaver, hidden, network, online]);

  const ton = useMemo(() => {
    const nano = data?.tonBalanceNano;
    if (!nano) return null;
    try {
      return formatTon(nano);
    } catch {
      return null;
    }
  }, [data?.tonBalanceNano]);

  const cet = useMemo(() => {
    const nano = data?.cetBalanceNano;
    if (!nano) return null;
    try {
      return formatCET(nano);
    } catch {
      return null;
    }
  }, [data?.cetBalanceNano]);

  if (!address) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <div className="font-mono text-[11px] text-solaris-muted">
          TON:
        </div>
        {loading && data == null ? (
          <Skeleton className="h-3 w-10 bg-white/10" />
        ) : (
          <div className="font-mono text-[11px] text-solaris-text tabular-nums">
            {ton ?? '—'}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <div className="font-mono text-[11px] text-solaris-muted">CET:</div>
        {loading && data == null ? (
          <Skeleton className="h-3 w-10 bg-white/10" />
        ) : (
          <div className="font-mono text-[11px] text-solaris-text tabular-nums">{cet ?? '—'}</div>
        )}
      </div>
      <a
        href={`https://tonviewer.com/${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
        aria-label="View wallet on TON explorer"
      >
        <ExternalLink className="w-4 h-4" aria-hidden />
      </a>
    </div>
  );
}
