import { ArrowLeftRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BSC_TESTNET } from '@/constants/evm';
import { fromNanoCET, TOKEN_DECIMALS } from '@/constants/token';

type Direction = 'wrap' | 'unwrap';

type Limits = {
  minCET: number;
  maxCET: number;
  baseFeeCET: number;
  feeBps: number;
  etaMs: number;
};

type Transfer = {
  id: string;
  status: 'created' | 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  direction: Direction;
  fromChain: 'TON' | 'BSC_TESTNET';
  toChain: 'TON' | 'BSC_TESTNET';
  amountMicro: string;
  feeMicro: string;
  netMicro: string;
  tonAddress: string;
  evmAddress: string | null;
  srcTxHash: string | null;
  dstTxHash: string | null;
  providerRef: string | null;
};

type ApiResponse = {
  ok: boolean;
  limits: Limits;
  wrappedBalanceMicro: string;
  transfers: Transfer[];
};

function fmtCET(micro: string): string {
  const v = fromNanoCET(micro);
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS });
}

function shortHash(h: string): string {
  const s = h.trim();
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

export default function BridgeSimulatorPanel({ token }: { token: string }) {
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [direction, setDirection] = useState<Direction>('wrap');
  const [amountCET, setAmountCET] = useState('50');
  const [evmAddress, setEvmAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/bridge/simulate', { headers: authHeaders, cache: 'no-store' });
    if (!res.ok) return;
    const json = (await res.json()) as ApiResponse;
    setData(json);
  }, [authHeaders]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4_000);
    return () => window.clearInterval(id);
  }, [load]);

  const limits = data?.limits ?? null;
  const wrappedBalance = data?.wrappedBalanceMicro ? fmtCET(data.wrappedBalanceMicro) : '—';

  const create = async () => {
    if (!amountCET.trim()) return;
    setBusy(true);
    setInfo(null);
    try {
      const res = await fetch('/api/bridge/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          direction,
          amountCET: amountCET.trim(),
          evmAddress: evmAddress.trim() || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setInfo(json?.error ? String(json.error) : 'Nu pot crea transferul.');
        return;
      }
      setAmountCET(direction === 'wrap' ? '50' : '10');
      await load();
    } catch {
      setInfo('Nu pot crea transferul.');
    } finally {
      setBusy(false);
    }
  };

  const chartData = useMemo(() => {
    const transfers = data?.transfers ?? [];
    const buckets = new Map<string, { day: string; volume: number }>();
    for (const t of transfers) {
      if (t.status !== 'confirmed') continue;
      const day = new Date(t.createdAt).toISOString().slice(0, 10);
      const amt = fromNanoCET(t.direction === 'wrap' ? t.netMicro : t.amountMicro);
      const prev = buckets.get(day)?.volume ?? 0;
      buckets.set(day, { day, volume: prev + amt });
    }
    return Array.from(buckets.values()).sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-14);
  }, [data?.transfers]);

  const transfers = data?.transfers ?? [];

  return (
    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ArrowLeftRight className="h-4 w-4" />
          Bridge simulator (TON ↔ BSC testnet)
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/60">
            Wrapped balance: <span className="font-mono text-white/85 tabular-nums">{wrappedBalance} wCET</span>
          </div>
          <Button
            variant="outline"
            onClick={() => void load()}
            className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 text-sm text-white/70 leading-relaxed">
        {limits ? (
          <>
            Limită: {limits.minCET}–{limits.maxCET} CET · Fee: max({limits.baseFeeCET} CET, {limits.feeBps} bps) · ETA:{' '}
            {Math.round(limits.etaMs / 1000)}s
          </>
        ) : (
          'Încarc limitele…'
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-4 flex gap-2">
          <Button onClick={() => setDirection('wrap')} className={direction === 'wrap' ? 'rounded-xl' : 'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10'}>
            Wrap
          </Button>
          <Button
            onClick={() => setDirection('unwrap')}
            className={direction === 'unwrap' ? 'rounded-xl' : 'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10'}
          >
            Unwrap
          </Button>
        </div>
        <div className="lg:col-span-4">
          <Input value={amountCET} onChange={(e) => setAmountCET(e.target.value)} inputMode="decimal" placeholder="Amount CET" />
        </div>
        <div className="lg:col-span-4">
          <Input
            value={evmAddress}
            onChange={(e) => setEvmAddress(e.target.value)}
            placeholder="EVM address (optional)"
            className={direction === 'wrap' ? '' : 'opacity-60'}
            disabled={direction !== 'wrap'}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={() => void create()} disabled={busy} className="rounded-xl">
          Start transfer
        </Button>
        <a
          href={`${BSC_TESTNET.blockExplorerUrl}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          BscScan <ExternalLink className="h-4 w-4" />
        </a>
        {info ? <div className="text-xs text-white/60">{info}</div> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-white font-semibold text-sm">Cross-chain activity (14d)</div>
          <div className="mt-3 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={(props) => {
                    if (!props.active || !props.payload?.length) return null;
                    const p = props.payload[0]?.payload as { day?: string; volume?: number };
                    return (
                      <div className="rounded-lg border border-white/12 bg-[color:var(--solaris-panel)] px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                        <div className="font-mono text-xs text-white/80">{String(p.day ?? '')}</div>
                        <div className="mt-1 text-sm text-white font-mono tabular-nums">{Number(p.volume ?? 0).toFixed(2)} CET</div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="var(--solaris-gold)" fill="rgba(242,201,76,0.14)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-white font-semibold text-sm">Transfers</div>
          <div className="mt-3 max-h-[220px] overflow-auto pr-2 space-y-2">
            {transfers.length === 0 ? (
              <div className="text-sm text-white/60">Niciun transfer încă.</div>
            ) : (
              transfers.map((t) => (
                <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-white font-semibold">
                      {t.direction} · {t.status}
                    </div>
                    <div className="text-xs text-white/55 font-mono">{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3 text-xs text-white/70">
                    <div>
                      Amount: <span className="font-mono text-white/85">{fmtCET(t.amountMicro)}</span> CET
                    </div>
                    <div>
                      Fee: <span className="font-mono text-white/85">{fmtCET(t.feeMicro)}</span> CET
                    </div>
                    <div>
                      Net: <span className="font-mono text-white/85">{fmtCET(t.netMicro)}</span> CET
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-white/55 font-mono">
                    src: {t.srcTxHash ? shortHash(t.srcTxHash) : '—'} · dst: {t.dstTxHash ? shortHash(t.dstTxHash) : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

