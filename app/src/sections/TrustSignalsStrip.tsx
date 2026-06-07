import { useEffect, useMemo, useState } from 'react';

import { companyProfile } from '@/data/companyProfile';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

import styles from './TrustSignalsStrip.module.css';

function useEasedCountUp({
  to,
  enabled,
  durationMs = 2000,
}: {
  to: number;
  enabled: boolean;
  durationMs?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (!Number.isFinite(to) || to <= 0) {
      setValue(0);
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setValue(to);
      return;
    }

    let raf = 0;
    const start = performance.now();
    let current = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      current += (to - current) * 0.05;
      if (Math.abs(to - current) < 0.5 || t >= 1) {
        setValue(to);
        return;
      }
      setValue(current);
      raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, to, durationMs]);

  return value;
}

function Star({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 2.6l2.83 5.74 6.33.92-4.58 4.46 1.08 6.3L12 17.92 6.34 20.02l1.08-6.3L2.84 9.26l6.33-.92L12 2.6Z"
      />
    </svg>
  );
}

export default function TrustSignalsStrip() {
  const { elementRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.18,
    rootMargin: '0px 0px -12% 0px',
    freezeOnceVisible: true,
  });

  const projects = useEasedCountUp({ to: 200, enabled: isVisible, durationMs: 2000 });
  const years = useEasedCountUp({ to: 5, enabled: isVisible, durationMs: 1400 });
  const guarantee = useEasedCountUp({ to: 100, enabled: isVisible, durationMs: 1600 });

  const reviewLine = useMemo(() => {
    const rv = companyProfile.reviews?.ratingValue ?? 4.9;
    const src = companyProfile.reviews?.sourceLabel ?? 'Recenzii';
    return `${rv.toFixed(1)}/5 · ${src}`;
  }, []);

  const [starsVisible, setStarsVisible] = useState(false);
  useEffect(() => {
    if (!isVisible) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setStarsVisible(true);
      return;
    }
    const id = window.setTimeout(() => setStarsVisible(true), 80);
    return () => window.clearTimeout(id);
  }, [isVisible]);

  const tickerText =
    'Monocristalin · Policristalin · TPO · Invertor · Tablă click · Țiglă metalică · Folie TPO ·';

  return (
    <section ref={elementRef} data-reveal className="relative z-20 bg-[#0d1421] text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <div className="p-6 sm:p-7" data-reveal-stagger>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-300/90">Dovadă socială</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: `${Math.round(projects)}+`,
                    label: 'Proiecte finalizate',
                  },
                  {
                    value: `${Math.round(years)}`,
                    label: 'ani pe piață',
                  },
                  {
                    value: `${Math.round(guarantee)}%`,
                    label: 'Garanție lucrări',
                  },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                    <div className="text-2xl sm:text-3xl font-black tabular-nums">{s.value}</div>
                    <div className="mt-1 text-sm font-semibold text-white/70">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 lg:border-t-0 lg:border-x lg:border-white/10 p-6 sm:p-7 flex items-center">
              <div className="w-full">
                <div className="sr-only">Tehnologii și termeni: {tickerText}</div>
                <div className={`${styles.ticker} text-sm font-semibold tracking-wide text-white/70`}>
                  <div className={styles.tickerTrack} aria-hidden>
                    <div className={styles.tickerChunk}>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                    </div>
                    <div className={styles.tickerChunk}>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                      <span>{tickerText}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 sm:p-7 flex items-center ${starsVisible ? styles.starsVisible : ''}`}>
              <div className="w-full">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-white">Clienți mulțumiți</div>
                    <div className="mt-1 text-xs text-white/60">{reviewLine}</div>
                  </div>
                  <div role="img" className="flex items-center gap-1 text-amber-400" aria-label={reviewLine}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${styles.star}`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Atestări & conformitate
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Execuție curată
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
                    Suport post-proiect
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
