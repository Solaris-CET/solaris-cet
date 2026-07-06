import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import LivePoolStats from '@/components/LivePoolStats';
import MarketWidget from '@/components/MarketWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLivePoolData } from '@/hooks/use-live-pool-data';
import { formatUsd } from '@/lib/utils';

type YieldPoint = {
  ts: string;
  tvlUsd: number;
  volume24hUsd: number;
  cetPriceUsd: number;
  tonPriceUsd: number;
};

function toNum(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function clampFloat(v: string, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function DefiHubPage() {
  const { tvlUsd, volume24hUsd, loading: poolLoading } = useLivePoolData();
  const [feeBps, setFeeBps] = useState('30');
  const [zapToken, setZapToken] = useState<'TON' | 'CET'>('TON');
  const [zapAmount, setZapAmount] = useState('10');
  const [flashBorrowUsd, setFlashBorrowUsd] = useState('10_000');
  const [flashEdgePct, setFlashEdgePct] = useState('0.70');
  const [flashFeeBps, setFlashFeeBps] = useState('9');
  const [history, setHistory] = useState<YieldPoint[]>([]);

  const lastPoint = history.length ? history[history.length - 1] : null;
  const effectiveTvlUsd = tvlUsd ?? lastPoint?.tvlUsd ?? null;
  const effectiveVolume24hUsd = volume24hUsd ?? lastPoint?.volume24hUsd ?? null;

  const estimatedAprPct = useMemo(() => {
    const fee = Math.max(0, clampFloat(feeBps.replace(/_/g, ''), 30)) / 10_000;
    const tvl = effectiveTvlUsd ?? 0;
    const vol = effectiveVolume24hUsd ?? 0;
    if (!tvl || !vol) return null;
    if (tvl <= 0 || vol <= 0) return null;
    return ((vol * fee * 365) / tvl) * 100;
  }, [feeBps, effectiveTvlUsd, effectiveVolume24hUsd]);

  const zapPlan = useMemo(() => {
    const amount = Math.max(0, clampFloat(zapAmount.replace(/_/g, ''), 0));
    if (!amount) return null;
    const swapPart = amount / 2;
    const lpPart = amount - swapPart;
    return { token: zapToken, amount, swapPart, lpPart };
  }, [zapAmount, zapToken]);

  const flash = useMemo(() => {
    const borrowUsd = Math.max(0, clampFloat(flashBorrowUsd.replace(/_/g, ''), 0));
    const edgePct = clampFloat(flashEdgePct.replace(/_/g, ''), 0.7) / 100;
    const feePct = Math.max(0, clampFloat(flashFeeBps.replace(/_/g, ''), 9)) / 10_000;
    const grossProfit = borrowUsd * edgePct;
    const fee = borrowUsd * feePct;
    const net = grossProfit - fee;
    const repay = borrowUsd + fee;
    return { borrowUsd, edgePct, feePct, grossProfit, fee, repay, net };
  }, [flashBorrowUsd, flashEdgePct, flashFeeBps]);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/yields-history.json', { headers: { Accept: 'application/json' }, signal: ac.signal, cache: 'no-store' })
      .then((r) => r.json() as Promise<unknown>)
      .then((raw) => {
        const arr = Array.isArray(raw) ? raw : [];
        const rows: YieldPoint[] = arr
          .map((x) => {
            if (!x || typeof x !== 'object') return null;
            const o = x as Record<string, unknown>;
            const ts = typeof o.ts === 'string' ? o.ts : '';
            const tvl = toNum(o.tvlUsd);
            const vol = toNum(o.volume24hUsd);
            const cet = toNum(o.cetPriceUsd);
            const ton = toNum(o.tonPriceUsd);
            if (!ts || tvl == null || vol == null || cet == null || ton == null) return null;
            return { ts, tvlUsd: tvl, volume24hUsd: vol, cetPriceUsd: cet, tonPriceUsd: ton };
          })
          .filter(Boolean)
          .slice(-240) as YieldPoint[];
        setHistory(rows);
      })
      .catch(() => setHistory([]));
    return () => ac.abort();
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Blockchain & DeFi Lab</h1>
            <p className="mt-2 text-white/70 text-sm">
              Module educaționale + date live (TON). Nimic nu execută tranzacții fără confirmare în wallet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/analysis" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Analiză tehnică
            </a>
            <a href="/app" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Dashboard
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <LivePoolStats />
          </div>
          <div className="lg:col-span-5">
            <MarketWidget coinId="the-open-network" />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <Tabs defaultValue="yield">
            <TabsList>
              <TabsTrigger value="yield">Yield aggregator</TabsTrigger>
              <TabsTrigger value="zap">Zap-in LP</TabsTrigger>
              <TabsTrigger value="flash">Flash loan</TabsTrigger>
              <TabsTrigger value="history">Istoric</TabsTrigger>
            </TabsList>

            <TabsContent value="yield" className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">DeDust LP (fee APR estimat)</div>
                  <div className="mt-3 text-sm text-white/70">
                    APR ≈ (Volum 24h × fee × 365) / TVL. Fee bps:
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Input value={feeBps} onChange={(e) => setFeeBps(e.target.value)} inputMode="numeric" className="w-[120px]" />
                    <div className="text-sm text-white/70">bps</div>
                  </div>
                  <div className="mt-4 text-sm text-white/70">
                    TVL: <span className="font-mono text-white/90">{formatUsd(effectiveTvlUsd)}</span> · Vol(24h):{' '}
                    <span className="font-mono text-white/90">{formatUsd(effectiveVolume24hUsd)}</span>
                  </div>
                  <div className="mt-3 text-lg text-solaris-gold font-mono tabular-nums">
                    {poolLoading ? '—' : estimatedAprPct == null ? '—' : `${estimatedAprPct.toFixed(2)}% APR`}
                  </div>
                  <div className="mt-4 text-xs text-white/55">
                    Acesta este un estimator educațional. Nu include impermanent loss, recompense suplimentare sau rebalancing.
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">Strategii (simulare)</div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-white font-semibold text-sm">LP CET/TON (DeDust)</div>
                      <div className="mt-1 text-xs text-white/60">
                        Fee APR estimat din on-chain volume/TVL. Poți folosi Zap-in ca să intri dintr-un singur token.
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-white font-semibold text-sm">TON staking (placeholder)</div>
                      <div className="mt-1 text-xs text-white/60">Integrare viitoare: staking pools via TonAPI.</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-white font-semibold text-sm">RWA vault (demo)</div>
                      <div className="mt-1 text-xs text-white/60">Model educațional pentru tokenizare/colateral.</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="zap" className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">Zap-in (un singur token → LP)</div>
                  <div className="mt-2 text-sm text-white/70">
                    Plan simplificat: 50% swap în tokenul opus, apoi add liquidity.
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => setZapToken('TON')}
                      className={zapToken === 'TON' ? 'rounded-xl' : 'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10'}
                    >
                      TON
                    </Button>
                    <Button
                      onClick={() => setZapToken('CET')}
                      className={zapToken === 'CET' ? 'rounded-xl' : 'rounded-xl bg-white/5 border border-white/10 hover:bg-white/10'}
                    >
                      CET
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Input value={zapAmount} onChange={(e) => setZapAmount(e.target.value)} inputMode="decimal" placeholder="Amount" />
                  </div>
                  <div className="mt-4 text-sm text-white/70">
                    {zapPlan ? (
                      <>
                        Swap: <span className="font-mono text-white/90">{zapPlan.swapPart.toFixed(4)}</span> {zapPlan.token} · LP:{' '}
                        <span className="font-mono text-white/90">{zapPlan.lpPart.toFixed(4)}</span> {zapPlan.token}
                      </>
                    ) : (
                      'Introdu o sumă.'
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">Pași (educațional)</div>
                  <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-white/70">
                    <li>Obții quote pentru swap pe DeDust.</li>
                    <li>Executi swap-ul pentru ~50% din sumă în tokenul opus.</li>
                    <li>Adaugi lichiditate (ambele tokenuri) în pool-ul CET/TON.</li>
                    <li>Primești LP tokens; randamentul provine din fee-urile de trading.</li>
                  </ol>
                  <div className="mt-4 text-xs text-white/55">
                    Pentru execuție reală: integrăm construcția tranzacției prin TonConnect + contract router-ul DeDust.
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flash" className="mt-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">Flash loan simulator</div>
                  <div className="mt-2 text-sm text-white/70">Borrow → execute strategy → repay in the same tx (simulat).</div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-xs text-white/60">Borrow (USD)</div>
                      <Input value={flashBorrowUsd} onChange={(e) => setFlashBorrowUsd(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Edge / profit brut (%)</div>
                      <Input value={flashEdgePct} onChange={(e) => setFlashEdgePct(e.target.value)} inputMode="decimal" />
                    </div>
                    <div>
                      <div className="text-xs text-white/60">Fee (bps)</div>
                      <Input value={flashFeeBps} onChange={(e) => setFlashFeeBps(e.target.value)} inputMode="numeric" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-white font-semibold">Rezultat</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 text-sm text-white/70">
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      Borrow: <span className="font-mono text-white/90">${flash.borrowUsd.toFixed(2)}</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      Repay: <span className="font-mono text-white/90">${flash.repay.toFixed(2)}</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      Profit brut: <span className="font-mono text-white/90">${flash.grossProfit.toFixed(2)}</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      Net: <span className={flash.net >= 0 ? 'font-mono text-emerald-300' : 'font-mono text-rose-300'}>${flash.net.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-white/55">
                    Dacă net &lt; 0, tranzacția ar fi revert (nu poate rambursa împrumutul).
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-white font-semibold">Randamente istorice (proxy)</div>
                  <div className="text-xs text-white/55 font-mono">{history.length ? `${history.length} puncte` : '—'}</div>
                </div>
                <div className="mt-3 text-sm text-white/70">
                  Snapshot-uri: TVL + volum 24h + prețuri. Curba de randament derivă din volume/TVL.
                </div>
                <div className="mt-5 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 6, right: 12, left: -10, bottom: 0 }}>
                      <XAxis dataKey="ts" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} hide />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        content={(props) => {
                          if (!props.active || !props.payload?.length) return null;
                          const p = props.payload[0]?.payload as YieldPoint;
                          return (
                            <div className="rounded-lg border border-white/12 bg-[color:var(--solaris-panel)] px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                              <div className="font-mono text-xs text-white/80">{new Date(p.ts).toLocaleString()}</div>
                              <div className="mt-1 text-sm text-white font-mono tabular-nums">TVL: {formatUsd(p.tvlUsd)}</div>
                              <div className="mt-1 text-xs text-white/70 font-mono tabular-nums">Vol24h: {formatUsd(p.volume24hUsd)}</div>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="tvlUsd" stroke="var(--solaris-cyan)" fill="rgba(0,209,255,0.12)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-white/55">
                  Datele sunt servite din `public/api/yields-history.json` (generat periodic de indexer).
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
