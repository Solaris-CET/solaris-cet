import { Calculator, Calendar, LineChart, Percent, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

import GlowOrbs from '../components/GlowOrbs';
import { useLivePoolData } from '../hooks/use-live-pool-data';
import { useLanguage } from '../hooks/useLanguage';
import { formatPrice } from '../lib/utils';

type PeriodDays = 30 | 90 | 180 | 365;

const PERIODS: Array<{ days: PeriodDays; apy: number }> = [
  { days: 30, apy: 0.12 },
  { days: 90, apy: 0.18 },
  { days: 180, apy: 0.24 },
  { days: 365, apy: 0.32 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatCET(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function buildLine(points: number[], w: number, h: number) {
  if (!points.length) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = points.length === 1 ? 0 : w / (points.length - 1);
  return points
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export default function StakingCalculatorSection() {
  const { t } = useLanguage();
  const { priceUsd } = useLivePoolData();
  const [amount, setAmount] = useState(1000);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(90);
  const [compound, setCompound] = useState(true);

  const apy = useMemo(() => {
    return PERIODS.find((p) => p.days === periodDays)?.apy ?? 0.18;
  }, [periodDays]);

  const { rewardCet, rewardUsd, endDate, seriesSimple, seriesCompound } = useMemo(() => {
    const principal = clamp(Number.isFinite(amount) ? amount : 0, 0, 1_000_000);
    const days = periodDays;
    const dailyRate = apy / 365;
    const simple = principal * apy * (days / 365);
    const compounded = principal * (Math.pow(1 + dailyRate, days) - 1);

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const chartPoints = 30;
    const stepDays = Math.max(1, Math.floor(days / chartPoints));
    const xs = Array.from({ length: chartPoints + 1 }, (_, i) => Math.min(days, i * stepDays));
    const simpleSeries = xs.map((d) => principal + principal * apy * (d / 365));
    const compoundSeries = xs.map((d) => principal * Math.pow(1 + dailyRate, d));

    const price = typeof priceUsd === 'number' && Number.isFinite(priceUsd) ? priceUsd : null;
    const usd = price === null ? null : (compound ? compounded : simple) * price;

    return {
      rewardCet: compound ? compounded : simple,
      rewardUsd: usd,
      endDate: end.toISOString().slice(0, 10),
      seriesSimple: simpleSeries,
      seriesCompound: compoundSeries,
    };
  }, [amount, apy, compound, periodDays, priceUsd]);

  const svg = useMemo(() => {
    const w = 260;
    const h = 80;
    return {
      w,
      h,
      p1: buildLine(seriesSimple, w, h),
      p2: buildLine(seriesCompound, w, h),
    };
  }, [seriesCompound, seriesSimple]);

  return (
    <section
      id="staking-calculator"
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
      aria-label={t.sectionAria.stakingCalculator}
    >
      <GlowOrbs variant="mixed" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">{t.stakingCalculator.kicker}</span>
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-3">
            {t.stakingCalculator.title}
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg max-w-2xl">
            {t.stakingCalculator.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="bento-card p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="font-display font-semibold text-lg text-solaris-text">
                {t.stakingCalculator.inputsTitle}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-mono text-solaris-muted">
                <Sparkles className="w-3.5 h-3.5 text-solaris-gold" aria-hidden />
                {priceUsd == null
                  ? t.stakingCalculator.priceUnavailable
                  : `${t.stakingCalculator.pricePrefix} ${formatPrice(priceUsd)}`}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="hud-label">{t.stakingCalculator.amountLabel}</label>
                  <span className="font-mono text-xs text-solaris-text tabular-nums">
                    {formatCET(amount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1_000_000}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-[rgb(242,201,76)]"
                />
                <div className="mt-3 flex gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1_000_000}
                    value={amount}
                    onChange={(e) => setAmount(clamp(Number(e.target.value || 0), 0, 1_000_000))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-solaris-text font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-solaris-gold/30"
                  />
                </div>
              </div>

              <div>
                <label className="hud-label mb-3 block">{t.stakingCalculator.durationLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PERIODS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      aria-pressed={periodDays === p.days}
                      onClick={() => setPeriodDays(p.days)}
                      className={[
                        'p-3 rounded-xl border transition-all duration-300 text-left',
                        periodDays === p.days
                          ? 'bg-solaris-gold/10 border-solaris-gold/35'
                          : 'bg-white/5 border-white/10 hover:border-white/20',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-solaris-text tabular-nums">
                          {p.days}d
                        </span>
                        <span className="font-mono text-[11px] text-solaris-muted tabular-nums">
                          {(p.apy * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-[10px] text-solaris-muted mt-1">{t.stakingCalculator.apyLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-solaris-cyan" aria-hidden />
                  <div>
                    <div className="text-sm font-semibold text-solaris-text">{t.stakingCalculator.compoundingTitle}</div>
                    <div className="text-[11px] font-mono text-solaris-muted">{t.stakingCalculator.compoundingEvery}</div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={compound}
                  onClick={() => setCompound((v) => !v)}
                  className={[
                    'px-4 py-2 rounded-xl border text-sm font-semibold transition-colors',
                    compound
                      ? 'border-solaris-gold/35 bg-solaris-gold/10 text-solaris-gold'
                      : 'border-white/10 bg-white/5 text-solaris-muted hover:text-solaris-text',
                  ].join(' ')}
                >
                  {compound ? t.stakingCalculator.compoundingOn : t.stakingCalculator.compoundingOff}
                </button>
              </div>

              <div className="text-xs text-solaris-muted/85 leading-relaxed">
                {t.stakingCalculator.estimateDisclaimer}
              </div>
            </div>
          </div>

          <div className="bento-card p-6 lg:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="font-display font-semibold text-lg text-solaris-text">
                {t.stakingCalculator.outputsTitle}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-mono text-solaris-muted">
                <Calendar className="w-3.5 h-3.5 text-solaris-gold" aria-hidden />
                {endDate}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted mb-2">
                  <Percent className="w-3.5 h-3.5 text-solaris-gold" aria-hidden />
                  {t.stakingCalculator.apyLabel}
                </div>
                <div className="font-mono text-xl text-solaris-text tabular-nums">
                  {(apy * 100).toFixed(0)}%
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-mono text-solaris-muted mb-2">{t.stakingCalculator.rewardCetLabel}</div>
                <div className="font-mono text-xl text-solaris-gold tabular-nums">
                  +{formatCET(rewardCet)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-mono text-solaris-muted mb-2">{t.stakingCalculator.rewardUsdLabel}</div>
                <div className="font-mono text-xl text-solaris-text tabular-nums">
                  {rewardUsd == null ? '—' : formatPrice(rewardUsd)}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-[11px] font-mono text-solaris-muted">{t.stakingCalculator.projectedBalanceLabel}</div>
                <div className="text-[11px] font-mono text-solaris-muted">
                  {compound ? t.stakingCalculator.modeCompound : t.stakingCalculator.modeSimple}
                </div>
              </div>
              <svg
                width={svg.w}
                height={svg.h}
                viewBox={`0 0 ${svg.w} ${svg.h}`}
                className="w-full"
                aria-hidden
              >
                {svg.p1 ? (
                  <polyline
                    points={svg.p1}
                    fill="none"
                    stroke="rgba(46,231,255,0.55)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null}
                {svg.p2 ? (
                  <polyline
                    points={svg.p2}
                    fill="none"
                    stroke="rgba(242,201,76,0.75)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={compound ? 1 : 0.45}
                  />
                ) : null}
              </svg>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-solaris-muted">
                <span>{formatCET(amount)} CET</span>
                <span>{formatCET(amount + rewardCet)} CET</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="#staking"
                className="btn-filled-gold inline-flex items-center justify-center gap-2 min-h-[48px] btn-quantum"
              >
                {t.stakingCalculator.ctaTokenomics}
              </a>
              <a
                href="https://t.me/+tKlfzx7IWopmNWQ0"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center justify-center gap-2 min-h-[48px] btn-quantum"
              >
                {t.stakingCalculator.ctaMiningBot}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
