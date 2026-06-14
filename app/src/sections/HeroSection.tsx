import { ArrowRight, BadgeCheck, MapPin, Phone } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import AppImage from '@/components/AppImage';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import SolarPanelAnimation from '@/components/animations/SolarPanelAnimation';

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
  const mainVisual =
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=80&auto=format&fit=crop';

  const particles = useMemo<Particle[]>(
    () => [
      {
        size: 220,
        left: '-8%',
        bottom: '-14%',
        opacity: 0.34,
        duration: '38s',
        delay: '-6s',
        color: 'rgba(245,158,11,0.85)',
      },
      {
        size: 180,
        left: '14%',
        bottom: '-8%',
        opacity: 0.22,
        duration: '32s',
        delay: '-9s',
        color: 'rgba(249,115,22,0.7)',
      },
      {
        size: 260,
        left: '36%',
        bottom: '-24%',
        opacity: 0.18,
        duration: '46s',
        delay: '-14s',
        color: 'rgba(255,255,255,0.18)',
      },
      {
        size: 200,
        left: '60%',
        bottom: '-16%',
        opacity: 0.28,
        duration: '36s',
        delay: '-11s',
        color: 'rgba(245,158,11,0.7)',
      },
      {
        size: 150,
        left: '74%',
        bottom: '-10%',
        opacity: 0.24,
        duration: '30s',
        delay: '-4s',
        color: 'rgba(249,115,22,0.6)',
        hiddenOnMobile: true,
      },
      {
        size: 280,
        left: '90%',
        bottom: '-26%',
        opacity: 0.2,
        duration: '52s',
        delay: '-18s',
        color: 'rgba(255,235,170,0.22)',
        hiddenOnMobile: true,
      },
      {
        size: 220,
        left: '24%',
        bottom: '14%',
        opacity: 0.22,
        duration: '48s',
        delay: '-25s',
        color: 'rgba(245,215,110,0.5)',
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

  const projects = useCountUp({ to: 183, enabled: isVisible });
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
      <div className={styles.heroArc} aria-hidden />

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

      <div className="absolute inset-0 z-0 opacity-30">
        <SolarPanelAnimation />
      </div>
      <div className={styles.heroVignette} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-24 sm:px-8 sm:pt-32 xl:px-12">
        <div className="grid min-h-[88svh] items-center gap-12 py-8 lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="max-w-3xl">
            <div
              className={`inline-flex items-center gap-3 rounded-full border border-amber-300/25 bg-gradient-to-r from-amber-400/[0.08] to-transparent px-4 py-2 text-[10px] font-extrabold tracking-[0.22em] text-amber-100 backdrop-blur ${styles.fadeUp}`}
              style={{ animationDelay: '0.15s' }}
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(245,215,110,0.85)]" />
              </span>
              FOTOVOLTAICE · ACOPERIȘURI · VASLUI & MOLDOVA
            </div>

            <h1
              className={`solaris-headline mt-8 text-white ${styles.fadeUp}`}
              style={{ animationDelay: '0.3s', fontSize: 'clamp(2.6rem, 6.8vw, 5.4rem)' }}
            >
              <span className="block">Sisteme</span>
              <span className="block">
                <em>fotovoltaice</em>
              </span>
              <span className="block text-white/92">și acoperișuri.</span>
            </h1>

            <div
              className={`mt-7 flex items-center gap-4 ${styles.fadeUp}`}
              style={{ animationDelay: '0.45s' }}
            >
              <span className="h-px w-12 bg-gradient-to-r from-amber-400/80 to-transparent" aria-hidden />
              <p className="text-base font-semibold tracking-wide text-amber-200/90 sm:text-lg">
                Executate profesionist în Vaslui și toată Moldova.
              </p>
            </div>

            <p
              className={`mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-slate-300/95 sm:text-[1.14rem] ${styles.fadeUp}`}
              style={{ animationDelay: '0.55s' }}
            >
              Proiectare, montaj și punere în funcțiune pentru fotovoltaice rezidențiale și industriale,
              plus acoperișuri din tablă, țiglă metalică sau TPO. Ofertă clară, pași reali, execuție curată.
            </p>

            <div
              className={`mt-7 flex flex-wrap gap-3 text-sm ${styles.fadeUp}`}
              style={{ animationDelay: '0.62s' }}
            >
              <div className="solaris-glass inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-slate-200">
                <MapPin className="h-4 w-4 text-amber-300" aria-hidden />
                <span className="font-semibold">Vaslui · deplasare în Moldova</span>
              </div>
              <div className={`solaris-glass inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white ${styles.badgePulse}`}>
                <BadgeCheck className="h-4 w-4 text-amber-300" aria-hidden />
                <span>Conformitate · detalii curate · suport post-montaj</span>
              </div>
            </div>

            <div
              className={`mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${styles.fadeUp}`}
              style={{ animationDelay: '0.75s' }}
            >
              <a
                href="/contact"
                className="solaris-cta-primary group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060B]"
              >
                Cere ofertă
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </a>

              <a
                href="tel:+40769889721"
                className="solaris-hover-lift inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.04] px-8 py-4 text-base font-bold text-white backdrop-blur hover:border-amber-300/55 hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Sună acum
              </a>

              <a
                href="#proiecte"
                className="solaris-hover-lift inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/10 bg-black/30 px-8 py-4 text-base font-bold text-white/85 backdrop-blur hover:border-amber-300/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Vezi lucrări
              </a>
            </div>

            <div
              ref={elementRef}
              data-reveal-stagger
              className={`mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${styles.fadeUp}`}
              style={{ animationDelay: '0.9s' }}
            >
              <div className="solaris-stat rounded-2xl px-4 py-4 backdrop-blur">
                <div className="solaris-gold-text text-[2rem] font-black leading-none tabular-nums">{projects}+</div>
                <div className="mt-2 text-sm font-semibold text-white/90">Proiecte finalizate</div>
                <div className="mt-1 text-xs text-slate-400">fotovoltaice, acoperișuri și intervenții</div>
              </div>
              <div className="solaris-stat rounded-2xl px-4 py-4 backdrop-blur">
                <div className="solaris-gold-text text-[2rem] font-black leading-none">10</div>
                <div className="mt-2 text-sm font-semibold text-white/90">ani garanție</div>
                <div className="mt-1 text-xs text-slate-400">PV, acoperișuri, TPO, atice, intervenții</div>
              </div>
              <div className="solaris-stat rounded-2xl px-4 py-4 backdrop-blur">
                <div className="solaris-gold-text text-[2rem] font-black leading-none tabular-nums">{years}+</div>
                <div className="mt-2 text-sm font-semibold text-white/90">ani pe piață</div>
                <div className="mt-1 text-xs text-slate-400">execuție curată și suport real</div>
              </div>
              <div className="solaris-stat rounded-2xl px-4 py-4 backdrop-blur">
                <div className="solaris-gold-text text-[2rem] font-black leading-none">24h</div>
                <div className="mt-2 text-sm font-semibold text-white/90">răspuns comercial</div>
                <div className="mt-1 text-xs text-slate-400">ofertă, clarificări, pași următori</div>
              </div>
            </div>
          </div>

          <div className={`relative ${styles.fadeUp}`} style={{ animationDelay: '0.5s' }}>
            <div className="solaris-card-gold relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-3 shadow-[0_60px_140px_-40px_rgba(245,158,11,0.35),0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
              <div
                className="absolute -inset-px rounded-[2rem] opacity-60"
                aria-hidden
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 0%, rgba(245,215,110,0.35) 0%, rgba(245,158,11,0) 55%)',
                }}
              />
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#04050a] via-[#04050a]/40 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" aria-hidden />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="solaris-glass rounded-[1.4rem] p-5">
                    <div className="solaris-eyebrow text-amber-200">Ce vede clientul</div>
                    <div className="mt-3 text-2xl font-black leading-tight text-white sm:text-[1.7rem]">
                      Montaj curat, ofertă clară, contact rapid
                    </div>
                    <div className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300/90">
                      De la consum și tipul acoperișului până la structură, protecții și punere în funcțiune
                      — explicat pe românește, fără ambiguități.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="solaris-card-gold rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <div className="solaris-eyebrow text-amber-200/90">Pentru case</div>
                <div className="mt-2 text-lg font-bold text-white">Consum, orientare, umbriri, baterie</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">
                  Dimensionăm sistemul pe situația reală, nu după un șablon generic.
                </div>
              </div>
              <div className="solaris-card-gold rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
                <div className="solaris-eyebrow text-amber-200/90">Hale & business</div>
                <div className="mt-2 text-lg font-bold text-white">Acoperiș, TPO și fotovoltaic în același flux</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">
                  Coerență între soluția tehnică, etanșare, acces și planificarea execuției.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
