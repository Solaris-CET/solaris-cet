import { useEffect, useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useLivePoolData } from '../hooks/use-live-pool-data';
import { formatPrice } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'solaris_price_sparkline_v1';
const MAX_POINTS = 32;

function safeReadPoints(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v));
  } catch {
    return [];
  }
}

function safeWritePoints(points: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
  } catch {
    void 0;
  }
}

function buildSparklinePath(values: number[], w: number, h: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length === 1 ? 0 : w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export default function HeaderPriceTicker({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { priceUsd, loading, error } = useLivePoolData();
  const [points, setPoints] = useState<number[]>(() => safeReadPoints());

  useEffect(() => {
    if (priceUsd == null || !Number.isFinite(priceUsd)) return;
    const id = window.setTimeout(() => {
      setPoints((prev) => {
        const next = prev.length ? [...prev] : safeReadPoints();
        const last = next[next.length - 1];
        if (typeof last === 'number' && Math.abs(last - priceUsd) < 1e-12) return next;
        next.push(priceUsd);
        while (next.length > MAX_POINTS) next.shift();
        safeWritePoints(next);
        return next;
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [priceUsd]);

  const deltaPct = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    if (!Number.isFinite(first) || first === 0) return null;
    return ((last - first) / first) * 100;
  }, [points]);

  const spark = useMemo(() => {
    const w = 64;
    const h = 18;
    const polyline = buildSparklinePath(points.slice(-MAX_POINTS), w, h);
    return { w, h, polyline };
  }, [points]);

  const deltaLabel =
    deltaPct == null ? '—' : `${deltaPct > 0 ? '+' : ''}${deltaPct.toFixed(2)}%`;
  const isUp = deltaPct != null && deltaPct > 0;
  const isDown = deltaPct != null && deltaPct < 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5',
        className,
      )}
      aria-label={t.livePool.labelCetPrice}
      title={error ? t.livePool.errorUnavailable : t.livePool.labelCetPrice}
    >
      <span className="font-mono text-[11px] text-solaris-muted">CET</span>
      <span className="font-mono text-[11px] font-bold text-solaris-gold tabular-nums">
        {loading ? '…' : formatPrice(priceUsd)}
      </span>
      <svg
        width={spark.w}
        height={spark.h}
        viewBox={`0 0 ${spark.w} ${spark.h}`}
        aria-hidden
        className={cn('opacity-90', spark.polyline ? '' : 'opacity-40')}
      >
        {spark.polyline ? (
          <polyline
            points={spark.polyline}
            fill="none"
            stroke="rgba(242,201,76,0.75)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-[11px] tabular-nums',
          isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-solaris-muted',
        )}
        aria-hidden
      >
        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : null}
        {deltaLabel}
      </span>
    </div>
  );
}
