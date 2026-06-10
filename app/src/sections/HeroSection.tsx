import { ArrowRight, BadgeCheck, MapPin, Phone } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import AppImage from '@/components/AppImage';
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
  const mainVisual = '/images/hero-solaris.svg';

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
    [],
  );

  const { elementRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.35,
    rootMargin: '0px 0px -10% 0px',
    freezeOnceVisible: true,
  });

  const projects = useCountUp({ to: 200, enabled: isVisible });
  const years = useCountUp({ to: 5, enabled: isVisible, durationMs: 650 });

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
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060B] via-[#05060B]/55 to-transparent" />
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

      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-24 sm:px-8 sm:pt-28 xl:px-12">
        <div className="grid min-h-[85svh] items-center gap-10 py-8 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="max-w-3xl">
            <div
              className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold tracking-wider text-white/85 backdrop-blur ${styles.fadeUp}`}
              style={{ animationDelay: '0.2s' }}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]" />
              FOTOVOLTAICE · ACOPERIȘURI · VASLUI & MOLDOVA
            </div>

            <h1 className={`mt-7 leading-[0.95] tracking-[-0.05em] text-white ${styles.fadeUp}`} style={{ animationDelay: '0.35s' }}>
              <span className={`block font-black ${styles.heroSerif} text-[2.5rem] sm:text-[3.25rem] md:text-[4.1rem] lg:text-[4.55rem]`}>
                Sisteme fotovoltaice
              </span>
              <span className={`mt-2 block font-black ${styles.heroSerif} text-[2rem] text-white/90 sm:text-[2.6rem] md:text-[3.3rem] lg:text-[3.75rem]`}>
                și acoperișuri
              </span>
              <span className="mt-4 block max-w-2xl text-lg font-bold tracking-wide text-amber-300 sm:text-xl">
                executate profesionist în Vaslui și în toată zona Moldovei
              </span>
            </h1>

            <p className={`mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-slate-300 sm:text-[1.12rem] ${styles.fadeUp}`} style={{ animationDelay: '0.55s' }}>
              Proiectare, montaj și punere în funcțiune pentru fotovoltaice rezidențiale și industriale, plus acoperișuri din tablă,
              țiglă metalică sau TPO. Primești ofertă clară, pași reali și execuție curată.
            </p>

            <div className={`mt-7 flex flex-wrap gap-3 text-sm text-slate-200 ${styles.fadeUp}`} style={{ animationDelay: '0.65s' }}>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
                <span className="font-semibold">Vaslui · deplasare în Moldova</span>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 font-semibold text-white backdrop-blur ${styles.badgePulse}`}>
                <BadgeCheck className="h-4 w-4 text-amber-400" aria-hidden />
                <span>Conformitate, detalii curate, suport după montaj</span>
              </div>
            </div>

            <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${styles.fadeUp}`} style={{ animationDelay: '0.78s' }}>
              <a
                href="/contact"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-4 text-base font-black text-black shadow-[0_18px_60px_rgba(245,158,11,0.18)] transition-transform will-change-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Cere ofertă
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>

              <a
                href="tel:+40769889721"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/[0.03] px-7 py-4 text-base font-bold text-white transition-colors hover:border-white/45 hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Sună acum
              </a>

              <a
                href="#proiecte"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/10 bg-black/25 px-7 py-4 text-base font-bold text-white/85 transition-colors hover:border-amber-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Vezi lucrări
              </a>
            </div>

            <div
              ref={elementRef}
              data-reveal-stagger
              className={`mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${styles.fadeUp}`}
              style={{ animationDelay: '0.9s' }}
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur">
                <div className="text-2xl font-black text-white tabular-nums">{projects}+</div>
                <div className="mt-1 text-sm font-semibold text-slate-200">proiecte estimate</div>
                <div className="mt-1 text-xs text-slate-400">fotovoltaice, acoperișuri și intervenții</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur">
                <div className="text-2xl font-black text-white">6</div>
                <div className="mt-1 text-sm font-semibold text-slate-200">tipuri de lucrări</div>
                <div className="mt-1 text-xs text-slate-400">fotovoltaice, acoperișuri, TPO, atice și intervenții</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur">
                <div className="text-2xl font-black text-white tabular-nums">{years}+</div>
                <div className="mt-1 text-sm font-semibold text-slate-200">ani experiență</div>
                <div className="mt-1 text-xs text-slate-400">cu accent pe execuție curată și suport</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 backdrop-blur">
                <div className="text-2xl font-black text-white">24h</div>
                <div className="mt-1 text-sm font-semibold text-slate-200">răspuns comercial</div>
                <div className="mt-1 text-xs text-slate-400">pentru ofertă, clarificări și pași următori</div>
              </div>
            </div>
          </div>

          <div className={`relative ${styles.fadeUp}`} style={{ animationDelay: '0.55s' }}>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur">
              <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10">
                <AppImage
                  src={mainVisual}
                  alt="Lucrare fotovoltaică pe acoperiș rezidențial, cu montaj curat și echipă în teren"
                  width={1200}
                  height={900}
                  loading="eager"
                  fetchPriority="high"
                  className="aspect-[4/3] h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04050a] via-[#04050a]/10 to-transparent" aria-hidden />
                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur">
                  Vizual orientativ
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Ce vede clientul</div>
                    <div className="mt-3 text-2xl font-black text-white sm:text-[1.8rem]">Montaj curat, ofertă clară, contact rapid</div>
                    <div className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
                      De la consum și tipul acoperișului până la structură, protecții și punere în funcțiune, primești o soluție explicată pe
                      românește.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300/90">Pentru case</div>
                <div className="mt-2 text-lg font-bold text-white">Consum, orientare, umbriri, baterie</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">Dimensionăm sistemul pe situația reală, nu după un șablon generic.</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300/90">Pentru hale & business</div>
                <div className="mt-2 text-lg font-bold text-white">Acoperiș, TPO și fotovoltaic în același flux</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">Coerență între soluția tehnică, etanșare, acces și planificarea execuției.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
