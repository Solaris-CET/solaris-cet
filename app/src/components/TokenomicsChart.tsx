import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Coins, Info, Eye, EyeOff } from 'lucide-react';
import { skillSeedFromLabel, standardSkillBurst } from '@/lib/meshSkillFeed';
import { TOKEN_DECIMALS } from '../constants/token';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useLanguage, type LangCode } from '@/hooks/useLanguage';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  TOKENOMICS_ALLOCATION,
  TOKENOMICS_BURNED_PCT,
  TOKENOMICS_HOLDERS,
  TOKENOMICS_TOTAL_SUPPLY_CET,
  tokenomicsAmountForPct,
  tokenomicsTextByLang,
  type TokenomicsAllocation,
  type TokenomicsAllocationId,
} from '@/data/tokenomics';

const BENTO_TILE_INTERACTION =
  'transition-all duration-300 hover:!-translate-y-1 hover:!scale-100 hover:!shadow-[0_0_15px_rgba(234,179,8,0.2)]';

type DistributionDatum = TokenomicsAllocation & { name: string; amount: number };

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DistributionDatum }>;
}

const CustomTooltip = ({ active, payload, lang }: TooltipProps & { lang: LangCode }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const skill = standardSkillBurst(skillSeedFromLabel(`tokenomics|pie|${d.id}`));
  return (
    <div className="bg-[#0D0E17] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono shadow-depth max-w-[min(90vw,280px)]">
      <div className="font-bold mb-1" style={{ color: d.color }}>
        {d.name}
      </div>
      <div className="text-solaris-text text-base font-bold">{d.pct.toFixed(2)}%</div>
      <div className="text-solaris-muted mt-1">{d.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })} CET</div>
      <div className="mt-2 flex items-start gap-2 text-[10px] text-solaris-muted leading-relaxed">
        <Info className="w-3.5 h-3.5 text-solaris-gold/80 shrink-0 mt-0.5" aria-hidden />
        <span>{tokenomicsTextByLang(lang, d.unlock)}</span>
      </div>
      <p
        className="mt-2 pt-2 border-t border-fuchsia-500/20 text-[9px] text-fuchsia-200/85 leading-snug line-clamp-3"
        title={skill}
      >
        {skill}
      </p>
    </div>
  );
};

function useCountUpValue(target: number, start: boolean, durationMs: number, prefersReducedMotion: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion) return;

    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, prefersReducedMotion, start, target]);

  if (!start) return 0;
  if (prefersReducedMotion) return target;
  return value;
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * TokenomicsChart — PieChart visualising the 4-way CET token distribution.
 * Total supply: 9,000 CET — shown in the donut center.
 */
const TokenomicsChart = () => {
  const { lang } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.25, freezeOnceVisible: true });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<TokenomicsAllocationId | null>(null);
  const [hidden, setHidden] = useState<Set<TokenomicsAllocationId>>(() => new Set());

  const supply = useCountUpValue(TOKENOMICS_TOTAL_SUPPLY_CET, isVisible, 1500, prefersReducedMotion);
  const burned = useCountUpValue(TOKENOMICS_BURNED_PCT, isVisible, 1500, prefersReducedMotion);
  const holders = useCountUpValue(TOKENOMICS_HOLDERS, isVisible, 1500, prefersReducedMotion);

  const distributionAll = useMemo<DistributionDatum[]>(() => {
    return TOKENOMICS_ALLOCATION.map((d) => {
      const name = tokenomicsTextByLang(lang, d.label);
      const amount = tokenomicsAmountForPct(TOKENOMICS_TOTAL_SUPPLY_CET, d.pct);
      return { ...d, name, amount };
    });
  }, [lang]);

  const distributionVisible = useMemo(() => {
    return distributionAll.filter((d) => !hidden.has(d.id));
  }, [distributionAll, hidden]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return distributionAll.find((d) => d.id === selectedId) ?? null;
  }, [distributionAll, selectedId]);

  const toggleHidden = (id: TokenomicsAllocationId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const visibleCount = TOKENOMICS_ALLOCATION.length - next.size;
        if (visibleCount <= 1) return next;
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section
      ref={elementRef as unknown as React.RefObject<HTMLElement>}
      aria-label={lang === 'ro' ? 'Tokenomics: distribuție' : 'Tokenomics: distribution'}
      className={`bento-card p-6 border border-solaris-gold/20 shadow-depth ${BENTO_TILE_INTERACTION} motion-safe:transition-all motion-safe:duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-solaris-gold/10 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-solaris-gold" aria-hidden />
          </div>
          <span className="hud-label text-solaris-gold text-[10px]">
            {lang === 'ro' ? 'DISTRIBUȚIE TOKEN · 9,000 CET' : 'TOKEN DISTRIBUTION · 9,000 CET'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-solaris-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden />
            {lang === 'ro' ? 'reveal la scroll' : 'scroll reveal'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="text-[10px] font-mono text-solaris-muted">{lang === 'ro' ? 'TOTAL SUPPLY' : 'TOTAL SUPPLY'}</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-solaris-gold">
            {supply.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })}
            <span className="ml-1 text-xs text-solaris-gold/70">CET</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="text-[10px] font-mono text-solaris-muted">{lang === 'ro' ? 'BURNED' : 'BURNED'}</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-rose-300">
            {burned.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="text-[10px] font-mono text-solaris-muted">{lang === 'ro' ? 'HOLDERI' : 'HOLDERS'}</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-cyan-200">
            {holders.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="mb-6 text-[10px] text-solaris-muted font-mono">
        {lang === 'ro'
          ? 'Notă: Burned și Holderi sunt valori configurabile (actualizează-le din datele tokenomics).'
          : 'Note: Burned and Holders are configurable values (update them in tokenomics data).'}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            {isVisible ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={240}>
                <PieChart>
                  <Pie
                    data={distributionVisible}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="90%"
                    dataKey="pct"
                    strokeWidth={0}
                    paddingAngle={2}
                    isAnimationActive={!prefersReducedMotion}
                    onMouseLeave={() => setActiveIndex(null)}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onClick={(_, index) => {
                      const item = distributionVisible[index];
                      if (!item) return;
                      setSelectedId((prev) => (prev === item.id ? null : item.id));
                    }}
                  >
                    {distributionVisible.map((entry, index) => {
                      const isActive = activeIndex === index;
                      const isSelected = selectedId === entry.id;
                      const opacity = hidden.has(entry.id) ? 0.25 : 1;
                      const stroke = isSelected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)';
                      return (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          opacity={opacity}
                          stroke={stroke}
                          strokeWidth={isSelected ? 3 : isActive ? 2 : 1}
                          cursor="pointer"
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip lang={lang} />} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-[0_0_12px_rgba(242,201,76,0.35)]">
              <div className="font-mono tabular-nums font-black text-3xl text-gradient-gold">
                {TOKENOMICS_TOTAL_SUPPLY_CET.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })}
              </div>
              <div className="text-solaris-gold/60 text-[10px] font-mono tracking-widest font-bold">
                {lang === 'ro' ? 'TOTAL SUPPLY' : 'TOTAL SUPPLY'}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 w-full">
          <div className="grid grid-cols-1 gap-2.5">
            {distributionAll.map((entry) => {
              const isHidden = hidden.has(entry.id);
              const isSelected = selectedId === entry.id;
              return (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-start gap-3 px-3 py-2.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                      style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}50` }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className={`text-left text-solaris-text text-xs font-semibold truncate hover:text-solaris-gold transition-colors ${
                            isHidden ? 'opacity-50' : ''
                          }`}
                          onClick={() => setSelectedId((prev) => (prev === entry.id ? null : entry.id))}
                          aria-pressed={isSelected}
                        >
                          {entry.name}
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs font-bold" style={{ color: entry.color }}>
                            {entry.pct}%
                          </span>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors inline-flex items-center justify-center"
                            onClick={() => toggleHidden(entry.id)}
                            aria-label={
                              isHidden
                                ? lang === 'ro'
                                  ? 'Afișează categorie'
                                  : 'Show category'
                                : lang === 'ro'
                                  ? 'Ascunde categorie'
                                  : 'Hide category'
                            }
                          >
                            {isHidden ? (
                              <Eye className="w-3.5 h-3.5 text-solaris-muted" aria-hidden />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-solaris-text/70" aria-hidden />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className={`text-solaris-muted text-[10px] leading-relaxed ${isHidden ? 'opacity-50' : ''}`}>
                          {tokenomicsTextByLang(lang, entry.unlock)}
                        </div>
                        <div className="font-mono text-[10px] text-solaris-muted shrink-0">
                          {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })} CET
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-1000"
                          style={{
                            width: `${isVisible ? entry.pct : 0}%`,
                            background: `linear-gradient(90deg, ${entry.color}CC, ${entry.color})`,
                            opacity: isHidden ? 0.25 : 1,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected ? (
            <div className="mt-4 rounded-xl border border-fuchsia-500/15 bg-fuchsia-500/[0.03] px-4 py-3">
              <div className="text-[10px] font-mono text-fuchsia-200/80">
                {lang === 'ro' ? 'SELECTAT' : 'SELECTED'}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-solaris-text">{selected.name}</div>
                <div className="font-mono text-xs text-solaris-muted">
                  {selected.pct.toFixed(2)}% · {selected.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: TOKEN_DECIMALS })} CET
                </div>
              </div>
              <div className="mt-1 text-[11px] text-solaris-muted">{tokenomicsTextByLang(lang, selected.unlock)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default TokenomicsChart;
