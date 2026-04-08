import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTonWallet } from '@tonconnect/ui-react';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function WalletBalance({ className }: { className?: string }) {
  const wallet = useTonWallet();
  const address = wallet?.account?.address?.trim() ?? null;
  const [data, setData] = useState<WalletBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setData(null);
      return;
    }

    let alive = true;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const json = (await res.json()) as WalletBalanceResponse;
        if (!alive) return;
        setData(json);
      } catch {
        if (!alive) return;
        setData({ ok: false, address, error: 'unavailable' });
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();
    const id = window.setInterval(run, 20_000);
    return () => {
      alive = false;
      controller.abort();
      window.clearInterval(id);
    };
  }, [address]);

  const ton = useMemo(() => {
    const nano = data?.tonBalanceNano;
    if (!nano) return null;
    try {
      return formatTon(nano);
    } catch {
      return null;
    }
  }, [data?.tonBalanceNano]);

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

