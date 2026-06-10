import { ArrowRight, BadgeCheck } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

import styles from './HeroSolaris.module.css';


type Particle = {
  size: number;
  left: string;
  bottom: string;
  opacity: number;
  duration: string;
  delay: string;
  color: string;
  hiddenOnMobile?: boolean;
};

function useCountUp({
  to,
  enabled,
  durationMs = 900,
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
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setValue(to);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, to, durationMs]);

  return value;
}

export default function HeroSection() {
  const particles = useMemo<Particle[]>(
    () => [
      {
        size: 180,
        left: '-12%',
        bottom: '-18%',
        opacity: 0.32,
        duration: '22s',
        delay: '-6s',
        color: 'rgba(245,158,11,0.85)',
      },
      {
        size: 140,
        left: '6%',
        bottom: '-10%',
        opacity: 0.26,
        duration: '18s',
        delay: '-9s',
        color: 'rgba(249,115,22,0.7)',
      },
      {
        size: 220,
        left: '18%',
        bottom: '-24%',
        opacity: 0.22,
        duration: '26s',
        delay: '-14s',
        color: 'rgba(255,255,255,0.26)',
      },
      {
        size: 160,
        left: '34%',
        bottom: '-14%',
        opacity: 0.38,
        duration: '24s',
        delay: '-11s',
        color: 'rgba(245,158,11,0.72)',
      },
      {
        size: 120,
        left: '44%',
        bottom: '-8%',
        opacity: 0.28,
        duration: '17s',
        delay: '-4s',
        color: 'rgba(249,115,22,0.62)',
      },
      {
        size: 190,
        left: '58%',
        bottom: '-22%',
        opacity: 0.24,
        duration: '23s',
        delay: '-16s',
        color: 'rgba(255,255,255,0.22)',
      },
      {
        size: 160,
        left: '70%',
        bottom: '-12%',
        opacity: 0.34,
        duration: '21s',
        delay: '-8s',
        color: 'rgba(245,158,11,0.68)',
        hiddenOnMobile: true,
      },
      {
        size: 130,
        left: '84%',
        bottom: '-16%',
        opacity: 0.2,
        duration: '19s',
        delay: '-12s',
        color: 'rgba(249,115,22,0.58)',
        hiddenOnMobile: true,
      },
      {
        size: 240,
        left: '92%',
        bottom: '-30%',
        opacity: 0.22,
        duration: '28s',
        delay: '-18s',
        color: 'rgba(255,255,255,0.22)',
        hiddenOnMobile: true,
      },
      {
        size: 150,
        left: '-6%',
        bottom: '10%',
        opacity: 0.22,
        duration: '26s',
        delay: '-20s',
        color: 'rgba(249,115,22,0.6)',
        hiddenOnMobile: true,
      },
      {
        size: 210,
        left: '20%',
        bottom: '6%',
        opacity: 0.3,
        duration: '30s',
        delay: '-25s',
        color: 'rgba(245,158,11,0.55)',
        hiddenOnMobile: true,
      },
      {
        size: 170,
        left: '48%',
        bottom: '12%',
        opacity: 0.22,
        duration: '27s',
        delay: '-13s',
        color: 'rgba(255,255,255,0.2)',
        hiddenOnMobile: true,
      },
    ],
    []
  );

  const { elementRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.35,
    rootMargin: '0px 0px -10% 0px',
    freezeOnceVisible: true,
  });

  const projects = useCountUp({ to: 200, enabled: isVisible });
  const years = useCountUp({ to: 5, enabled: isVisible, durationMs: 650 });

  const fullTagline = 'Fotovoltaice · Acoperișuri · Construcții';
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setTyped(fullTagline);
      return;
    }

    let i = 0;
    let timer = 0;
    let pause = 0;

    const tick = () => {
      if (pause > 0) {
        pause -= 1;
        timer = window.setTimeout(tick, 120);
        return;
      }

      i += 1;
      setTyped(fullTagline.slice(0, i));
      if (i >= fullTagline.length) {
        pause = 16;
        i = 0;
      }
      timer = window.setTimeout(tick, 42);
    };

    timer = window.setTimeout(tick, 240);
    return () => window.clearTimeout(timer);
  }, []);

  const rays = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => {
        const angle = (idx / 12) * Math.PI * 2 - Math.PI * 0.18;
        const cx = 600;
        const cy = 350;
        const r0 = 90;
        const r1 = 520;
        const x1 = cx + Math.cos(angle) * r0;
        const y1 = cy + Math.sin(angle) * r0;
        const x2 = cx + Math.cos(angle) * r1;
        const y2 = cy + Math.sin(angle) * r1;
        const baseOpacity = 0.08 + (idx % 4) * 0.04;
        return {
          key: idx,
          x1,
          y1,
          x2,
          y2,
          opacity: Math.min(0.25, baseOpacity),
          delay: `${idx * 0.08}s`,
        };
      }),
    [],
  );

  return (
    <section className={`relative overflow-hidden ${styles.hero}`}>
      <div className={styles.particles} aria-hidden>
        {particles.map((p, idx) => (
          <span
            key={idx}
            className={`${styles.particle} ${p.hiddenOnMobile ? 'hidden sm:block' : ''}`}
            style={
              {
                ['--size' as never]: `${p.size}px`,
                ['--left' as never]: p.left,
                ['--bottom' as never]: p.bottom,
                ['--opacity' as never]: String(p.opacity),
                ['--duration' as never]: p.duration,
                ['--delay' as never]: p.delay,
                ['--color' as never]: p.color,
              } as CSSProperties
            }
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060B] via-[#05060B]/50 to-transparent" />
      </div>

      <svg className={styles.rays} viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden>
        {rays.map((r) => (
          <line
            key={r.key}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke={`rgba(242,201,76,${r.opacity})`}
            strokeWidth="1"
            className={styles.ray}
            style={{ ['--delay' as never]: r.delay } as CSSProperties}
          />
        ))}
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 xl:px-12 pt-24 sm:pt-28 pb-14">
        <div className="min-h-[85svh] md:min-h-[100svh] flex flex-col justify-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold tracking-wider text-white/85 backdrop-blur ${styles.fadeUp}`}
            style={{ animationDelay: '0.2s' }}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]" />
            SOLUȚII COMPLETE · EXECUȚIE PROFESIONISTĂ
          </div>

          <h1 className={`mt-7 leading-[0.92] tracking-[-0.05em] text-white ${styles.fadeUp}`} style={{ animationDelay: '0.35s' }}>
            <span className={`block font-black ${styles.heroSerif} text-[2.4rem] sm:text-[3.1rem] md:text-[4.0rem] lg:text-[4.4rem]`}>
              Instalații fotovoltaice
            </span>
            <span className={`mt-1 block font-black ${styles.heroSerif} text-[2.1rem] sm:text-[2.7rem] md:text-[3.4rem] lg:text-[3.8rem]`}>
              și acoperișuri
            </span>
            <span className="mt-3 block text-base sm:text-lg font-extrabold tracking-wide text-amber-300">
              Solaris CET · Vaslui · România
            </span>
          </h1>

          <div className={`mt-5 text-[1.2rem] sm:text-[1.35rem] text-slate-200 ${styles.fadeUp}`} style={{ animationDelay: '0.5s' }}>
            <span className={styles.typewriter}>
              <span className="font-semibold">{typed}</span>
              <span className={styles.caret} aria-hidden />
            </span>
          </div>

          <p className={`mt-5 text-[1.05rem] leading-relaxed text-slate-300 max-w-2xl ${styles.fadeUp}`} style={{ animationDelay: '0.6s' }}>
            Instalații fotovoltaice, acoperișuri (tablă / țiglă / TPO), lucrări de construcții, atice & fațade din tablă, plus reparații și mentenanță.
          </p>

          <div className={`mt-8 flex flex-col sm:flex-row gap-4 ${styles.fadeUp}`} style={{ animationDelay: '0.75s' }}>
            <a
              href="/contact"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-4 text-base font-black text-black shadow-[0_18px_60px_rgba(245,158,11,0.18)] transition-transform will-change-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Cere ofertă
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>

            <a
              href="/servicii"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/35 bg-white/0 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              Servicii
            </a>
          </div>

          <div
            ref={elementRef}
            data-reveal-stagger
            className={`mt-8 flex flex-wrap gap-3 ${styles.fadeUp}`}
            style={{ animationDelay: '0.9s' }}
          >
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
              <div className="text-base font-black text-white tabular-nums">{projects}+</div>
              <div className="text-sm font-semibold text-slate-200">Proiecte</div>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
              <div className="text-sm font-black text-white">Vaslui</div>
              <div className="text-sm text-white/55">·</div>
              <div className="text-sm font-bold text-slate-200">toată România</div>
            </div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
              <div className="text-base font-black text-white tabular-nums">{years}</div>
              <div className="text-sm font-semibold text-slate-200">ani experiență</div>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white backdrop-blur ${styles.badgePulse}`}>
              <BadgeCheck className="h-5 w-5 text-amber-400" aria-hidden />
              <span>Atestat ANRE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
