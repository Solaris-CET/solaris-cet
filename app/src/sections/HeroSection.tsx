import { ArrowRight, BadgeCheck, Phone } from 'lucide-react';
import { type CSSProperties, lazy, Suspense, useEffect, useMemo, useState } from 'react';

import AppImage from '@/components/AppImage';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useDesktop3DEligible } from '@/hooks/useDesktop3DEligible';

import styles from './HeroSolaris.module.css';

const HeroTokenHologram = lazy(() => import('@/experience/HeroTokenHologram'));

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

  const { elementRef: visualRef, isVisible: visualVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '200px 0px',
    freezeOnceVisible: true,
  });

  const desktop3DEligible = useDesktop3DEligible();
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    if (!desktop3DEligible) return;
    if (!visualVisible) return;
    setShow3D(true);
  }, [desktop3DEligible, visualVisible]);

  const projects = useCountUp({ to: 50, enabled: isVisible });
  const kw = useCountUp({ to: 750, enabled: isVisible });
  const counties = useCountUp({ to: 12, enabled: isVisible });

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

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 xl:px-12 pt-24 sm:pt-28 pb-10 sm:pb-14">
        <div className={styles.diagonalSplit} aria-hidden />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center min-h-[calc(100svh-7rem)]">
          <div className="lg:col-span-6">
            <div
              className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold tracking-wider text-white/85 ${styles.fadeUp}`}
              style={{ animationDelay: '0.2s' }}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.55)]" />
              SOLUȚII COMPLETE · EXECUȚIE PROFESIONISTĂ
            </div>

            <h1
              className={`mt-6 font-display font-bold leading-[1.02] tracking-[-0.04em] text-white text-[2rem] sm:text-[2.6rem] lg:text-[3.5rem] ${styles.fadeUp}`}
              style={{ animationDelay: '0.4s' }}
            >
              Solaris <span className="text-amber-400">CET</span> —
              <span className={`ml-2 ${styles.gradientWord}`}>fotovoltaice</span> și acoperișuri care arată impecabil
            </h1>

            <p
              className={`mt-5 text-[1.05rem] leading-relaxed text-slate-300 max-w-xl ${styles.fadeUp}`}
              style={{ animationDelay: '0.55s' }}
            >
              Instalăm sisteme fotovoltaice, executăm lucrări de construcții și realizăm acoperișuri tablă/țiglă/folie TPO,
              atice și fațade din tablă, plus reparații și mentenanță.
            </p>

            <div className={`mt-8 flex flex-col sm:flex-row gap-4 ${styles.fadeUp}`} style={{ animationDelay: '0.7s' }}>
              <a
                href="/contact"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-4 text-base font-black text-black shadow-[0_18px_60px_rgba(245,158,11,0.18)] transition-transform will-change-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Cere ofertă gratuită
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>

              <a
                href="tel:+40769889721"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/0 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                aria-label="Sună acum la +40 769 889 721"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Sună acum
              </a>
            </div>

            <div className={`mt-7 text-sm text-white/70 ${styles.fadeUp}`} style={{ animationDelay: '0.85s' }}>
              <a
                className="hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/60"
                href="mailto:solaris-cet@protonmail.com"
              >
                solaris-cet@protonmail.com
              </a>
              <span className="mx-2 text-white/35">•</span>
              <span className="text-white/60">Acoperire națională</span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative">
              <div
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-400/15 via-orange-500/5 to-transparent blur-2xl"
                aria-hidden
              />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
                <div ref={visualRef} className={`relative aspect-[4/3] w-full ${styles.clipImage}`}>
                  <AppImage
                    src="/images/hero-solaris.svg"
                    alt="Montaj fotovoltaic și acoperișuri executate profesional"
                    className={`h-full w-full object-cover transition-opacity duration-500 ${show3D ? 'opacity-30' : 'opacity-100'}`}
                    width={1600}
                    height={1200}
                    loading="eager"
                    fetchPriority="high"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-transparent" aria-hidden />
                  {show3D ? (
                    <Suspense fallback={null}>
                      <HeroTokenHologram quality="high" seed={0.62} />
                    </Suspense>
                  ) : null}
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-[#05060B]/70 via-transparent to-transparent" aria-hidden />

                <div
                  className={`absolute left-5 top-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm font-semibold text-white backdrop-blur ${styles.badgePulse}`}
                >
                  <BadgeCheck className="h-5 w-5 text-amber-400" aria-hidden />
                  <span>Atestat ANRE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={elementRef} className="mt-10 sm:mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 backdrop-blur">
            <div className="text-center sm:text-left">
              <div className="text-3xl font-black text-white tabular-nums">{projects}+</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">proiecte</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white tabular-nums">{kw} kW</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">instalați</div>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-3xl font-black text-white tabular-nums">{counties}</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">județe</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Valorile sunt orientative și se actualizează pe baza portofoliului curent.
          </div>
        </div>
      </div>
    </section>
  );
}
