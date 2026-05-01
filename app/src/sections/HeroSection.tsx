import { CheckCircle, ChevronDown, FileText,ShieldCheck, TrendingUp } from 'lucide-react';
import React, { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import AppImage from '@/components/AppImage';
import { CetSymbol } from '@/components/CetSymbol';
import { useCommunityProof } from '@/hooks/use-community-proof';
import { useLivePoolData } from '@/hooks/use-live-pool-data';
import { useDemoBeatAudio } from '@/hooks/useDemoBeatAudio';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSessionSeed } from '@/hooks/useSessionSeed';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { formatCetSupplyWithSuffix, formatTaskAgentMeshHeadline } from '@/lib/numerals';
import { loadGsapWithScrollTrigger } from '@/lib/gsapLazy';

import AnimatedCounter from '../components/AnimatedCounter';
import QuantumFieldCanvas from '../components/QuantumFieldCanvas';
import SolarRaysCoinsCanvas from '../components/SolarRaysCoinsCanvas';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useAsyncCssReady } from '../hooks/useAsyncCssReady';
import { useLanguage } from '../hooks/useLanguage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTonConnectFeature } from '@/tonconnect/TonConnectFeatureContext';

const HeroTokenHologram = lazy(() => import('@/experience/HeroTokenHologram'));
const WalletConnect = lazy(() => import('@/components/WalletConnect'));
const CetAiSearch = lazy(() => import('@/components/CetAiSearch'));

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

const TICKER_DATA = [
  { label: 'AI AGENTS', value: '' },
  { label: 'SUPPLY', value: '' },
  { label: 'NETWORK', value: 'TON' },
  { label: 'THROUGHPUT', value: 'SHARDED' },
  { label: 'FINALITY', value: '≈2s' },
  { label: 'POOL', value: 'DeDust' },
  { label: 'MINING', value: '90 YEARS' },
  { label: 'DEPARTMENTS', value: '10' },
  { label: 'UPTIME', value: '24/7' },
  { label: 'AUDIT', value: 'CYBERSCOPE' },
  { label: 'CHAIN', value: 'MAINNET' },
  { label: 'PROTOCOL', value: 'RAV' },
  { label: 'AI MODE', value: 'DUAL (OPT.)' },
  { label: 'RWA BACKING', value: 'CETĂȚUIA, RO' },
];

type HeroStatState = {
  totalSupply: number;
  marketCap: number;
  aiAgents: number;
};

type PublicStateJson = {
  token?: {
    totalSupply?: string | number;
  };
};

function parseTotalSupply(input: unknown): number | null {
  if (!input || typeof input !== 'object') return null;
  const token = (input as PublicStateJson).token;
  if (!token || typeof token !== 'object') return null;
  const raw = (token as { totalSupply?: unknown }).totalSupply;
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

type HeroSectionProps = {
  cinematic?: boolean;
};

const HeroSection: React.FC<HeroSectionProps> = ({ cinematic = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const tickerContainerRef = useRef<HTMLDivElement>(null);
  const demoCutRef = useRef<HTMLDivElement>(null);
  const demoHardCutDoneRef = useRef(false);

  const prefersReducedMotion = useReducedMotion();
  const cssReady = useAsyncCssReady();
  const { ready: tonConnectReady, enable: enableTonConnect } = useTonConnectFeature();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isAutomated = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const navAny = navigator as Navigator & { webdriver?: boolean };
    return navAny.webdriver === true;
  }, []);
  const signatureSeed = useSessionSeed('heroHologram');
  const { t, lang } = useLanguage();
  const [poolEnabled, setPoolEnabled] = useState(false);
  const pool = useLivePoolData({ enabled: poolEnabled });
  const community = useCommunityProof();
  const [stats, setStats] = useState<HeroStatState>({
    totalSupply: 9000,
    marketCap: 214500,
    aiAgents: 200000,
  });

  const tickerRows = useMemo(() => {
    const supply = formatCetSupplyWithSuffix(lang);
    const agents = formatTaskAgentMeshHeadline(lang);
    return TICKER_DATA.map((row) => {
      if (row.label === 'SUPPLY') return { ...row, value: supply };
      if (row.label === 'AI AGENTS') return { ...row, value: agents };
      return row;
    });
  }, [lang]);

  const holoQuality = useMemo(() => {
    if (!cinematic) return null;
    if (prefersReducedMotion) return null;
    const navAny =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as { connection?: { saveData?: boolean }; deviceMemory?: number })
        : null;
    const saveData = navAny?.connection?.saveData === true;
    const dm = typeof navAny?.deviceMemory === 'number' ? navAny.deviceMemory : null;
    if (saveData) return null;
    if (isMobile) {
      if (dm !== null && dm < 4) return null;
      return 'low' as const;
    }
    if (isDesktop && dm !== null && dm >= 6) return 'high' as const;
    return 'low' as const;
  }, [cinematic, prefersReducedMotion, isDesktop, isMobile]);

  const enableHologram = holoQuality !== null && !isAutomated;
  const allowWebglDecor = !prefersReducedMotion && !isMobile && !isAutomated;
  const isDemoRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return path === '/demo';
  }, []);
  const superCinematic =
    cinematic && isDemoRoute && isDesktop && !isMobile && !prefersReducedMotion && !isAutomated;

  const [hologramReady, setHologramReady] = useState(false);
  const [hasUserIntent, setHasUserIntent] = useState(false);
  const [tickerExpanded, setTickerExpanded] = useState(false);
  const [cetAiReady, setCetAiReady] = useState(false);

  const [demoSound, setDemoSound] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('solarisDemoSound') === '1';
    } catch {
      return false;
    }
  });

  useDemoBeatAudio(demoSound && superCinematic);

  useLayoutEffect(() => {
    if (isMobile || prefersReducedMotion) {
      if (titleContainerRef.current) {
        titleContainerRef.current.style.opacity = '1';
        titleContainerRef.current.style.transform = 'none';
      }
      if (tickerContainerRef.current) {
        tickerContainerRef.current.style.opacity = '1';
        tickerContainerRef.current.style.transform = 'none';
      }
      return;
    }

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    void loadGsapWithScrollTrigger().then(({ gsap }) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        const mainTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } });

        mainTl
          .fromTo(titleContainerRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0.2)
          .fromTo(tickerContainerRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6');
      }, containerRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [prefersReducedMotion, isMobile]);

  useLayoutEffect(() => {
    if (!superCinematic) return;
    if (!cssReady) return;
    const el = containerRef.current;
    const bg = backgroundRef.current;
    const title = titleContainerRef.current;
    const ticker = tickerContainerRef.current;
    const cut = demoCutRef.current;
    if (!el || !bg || !title || !ticker || !cut) return;

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    void loadGsapWithScrollTrigger().then(({ gsap }) => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        gsap.set(bg, { transformOrigin: '50% 50%', willChange: 'transform' });
        gsap.set(title, { willChange: 'transform, opacity' });
        gsap.set(ticker, { willChange: 'transform, opacity' });
        gsap.set(cut, { willChange: 'transform, opacity', opacity: 0, yPercent: 110 });

        const setScrub = (p: number) => {
          const v = clamp01(p);
          document.documentElement.style.setProperty('--demo-scrub', v.toFixed(3));
          window.dispatchEvent(new CustomEvent('solaris:demoScrub', { detail: { progress: v } }));
        };
        setScrub(0);

        const hardCut = () => {
          if (demoHardCutDoneRef.current) return;
          const target = document.querySelector<HTMLElement>('#problem-agriculture');
          if (!target) return;
          demoHardCutDoneRef.current = true;
          window.dispatchEvent(new CustomEvent('solaris:demoBeat', { detail: { intensity: 1 } }));
          const y = target.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, y);
          gsap.killTweensOf(cut);
          gsap.set(cut, { opacity: 0, yPercent: 0 });
          gsap.to(cut, { opacity: 1, duration: 0.08, ease: 'power2.out', overwrite: true });
          gsap.to(cut, { opacity: 0, duration: 0.22, ease: 'power2.in', delay: 0.08, overwrite: true });
        };

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=180%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            pinSpacing: true,
            onUpdate: (self: { progress: number }) => setScrub(self.progress),
            onLeave: () => hardCut(),
            onEnterBack: () => {
              demoHardCutDoneRef.current = false;
            },
          },
        });

        tl.to(bg, { y: -96, scale: 1.12 }, 0);
        tl.to(title, { y: -62, scale: 0.955, opacity: 0.86 }, 0);
        tl.to(ticker, { y: 38, scale: 0.975, opacity: 0.9 }, 0);

        tl.to(cut, { opacity: 0.86, yPercent: 0 }, 0.74);
        tl.to(cut, { opacity: 0, yPercent: -110 }, 0.9);
      }, el);
    });

    return () => {
      cancelled = true;
      document.documentElement.style.removeProperty('--demo-scrub');
      window.dispatchEvent(new CustomEvent('solaris:demoScrub', { detail: { progress: 0 } }));
      ctx?.revert();
    };
  }, [superCinematic, cssReady]);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const run = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/state.json`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as unknown;
        const totalSupply = parseTotalSupply(json);
        if (!alive) return;
        if (totalSupply != null) {
          setStats((prev) => ({ ...prev, totalSupply }));
        }
      } catch {
        void 0;
      }
    };
    void run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    let armed = true;
    const enable = () => {
      if (!armed || cancelled) return;
      armed = false;
      setPoolEnabled(true);
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('scroll', enable);
    };

    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('keydown', enable, { once: true });
    window.addEventListener('scroll', enable, { once: true, passive: true });
    const t = window.setTimeout(enable, 9000);
    return () => {
      cancelled = true;
      cleanup();
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (superCinematic) return;
    const bg = backgroundRef.current;
    if (!bg) return;
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.max(-160, -window.scrollY * 0.3);
      bg.style.setProperty('--hero-scroll-y-px', `${y}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      bg.style.removeProperty('--hero-scroll-y-px');
    };
  }, [prefersReducedMotion, superCinematic]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (superCinematic) {
      setHasUserIntent(true);
      return;
    }

    let fired = false;
    let timeoutId = 0;
    const fire = () => {
      if (fired) return;
      fired = true;
      cleanup();
      setHasUserIntent(true);
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', fire);
      window.removeEventListener('keydown', fire);
      window.removeEventListener('scroll', fire);
      window.removeEventListener('touchstart', fire);
      window.clearTimeout(timeoutId);
    };
    window.addEventListener('pointerdown', fire, { passive: true });
    window.addEventListener('keydown', fire);
    window.addEventListener('scroll', fire, { passive: true });
    window.addEventListener('touchstart', fire, { passive: true });
    timeoutId = window.setTimeout(fire, 15_000);
    return cleanup;
  }, [superCinematic]);

  useEffect(() => {
    if (hasUserIntent) {
      setCetAiReady(true);
      return;
    }
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const enable = () => {
      if (cancelled) return;
      setCetAiReady(true);
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(enable, { timeout: 9000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(enable, 9000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [hasUserIntent]);

  useEffect(() => {
    if (!enableHologram) {
      setHologramReady(false);
      return;
    }
    if (!hasUserIntent) {
      setHologramReady(false);
      return;
    }
    if (!cssReady) return;
    if (superCinematic) {
      setHologramReady(true);
      return;
    }

    let cancelled = false;
    let idleTimeoutId: number | null = null;
    let idleCallbackId: number | null = null;
    let activated = false;

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const show = () => {
      if (cancelled) return;
      setHologramReady(true);
    };

    const scheduleShow = () => {
      if (typeof w.requestIdleCallback === 'function') {
        idleCallbackId = w.requestIdleCallback(show, { timeout: 1200 });
        return;
      }
      idleTimeoutId = window.setTimeout(show, 900);
    };

    function cleanup() {
      window.removeEventListener('pointerdown', onActivate);
      window.removeEventListener('keydown', onActivate);
      window.removeEventListener('touchstart', onActivate);
    }

    function onActivate() {
      if (cancelled) return;
      if (activated) return;
      activated = true;
      cleanup();
      scheduleShow();
    }

    window.addEventListener('pointerdown', onActivate, { once: true, passive: true });
    window.addEventListener('keydown', onActivate, { once: true });
    window.addEventListener('touchstart', onActivate, { once: true, passive: true });

    return () => {
      cancelled = true;
      cleanup();
      if (idleCallbackId !== null && typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleCallbackId);
      if (idleTimeoutId !== null) window.clearTimeout(idleTimeoutId);
    };
  }, [enableHologram, hasUserIntent, cssReady, superCinematic]);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (cancelled) return;
      setTickerExpanded(true);
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof window === 'undefined') return;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(enable, { timeout: 2000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(enable, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (superCinematic) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const el = containerRef.current;
    const bg = backgroundRef.current;
    if (!el || !bg) return;
    const isBelowDesktop = window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;

    const maxX = 10;
    const maxY = 8;
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;

    const commit = () => {
      raf = 0;
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      bg.style.setProperty('--hero-parallax-x-px', `${pos.x.toFixed(2)}px`);
      bg.style.setProperty('--hero-parallax-y-px', `${pos.y.toFixed(2)}px`);
      if (Math.abs(pos.x - target.x) > 0.2 || Math.abs(pos.y - target.y) > 0.2) {
        raf = window.requestAnimationFrame(commit);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(commit);
    };

    let rect = el.getBoundingClientRect();
    let rectRaf = 0;
    const refreshRect = () => {
      rectRaf = 0;
      rect = el.getBoundingClientRect();
    };
    const scheduleRect = () => {
      if (rectRaf) return;
      rectRaf = window.requestAnimationFrame(refreshRect);
    };

    const ro = new ResizeObserver(scheduleRect);
    ro.observe(el);
    window.addEventListener('scroll', scheduleRect, { passive: true });

    const onMove = (e: PointerEvent) => {
      const r = rect;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = r.width > 0 ? (e.clientX - cx) / (r.width / 2) : 0;
      const ny = r.height > 0 ? (e.clientY - cy) / (r.height / 2) : 0;
      target.x = Math.max(-1, Math.min(1, nx)) * maxX;
      target.y = Math.max(-1, Math.min(1, ny)) * maxY;
      schedule();
    };

    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      schedule();
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });

    bg.style.setProperty('--hero-parallax-x-px', '0px');
    bg.style.setProperty('--hero-parallax-y-px', '0px');

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', scheduleRect);
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      if (rectRaf) window.cancelAnimationFrame(rectRaf);
      bg.style.removeProperty('--hero-parallax-x-px');
      bg.style.removeProperty('--hero-parallax-y-px');
    };
  }, [prefersReducedMotion, superCinematic]);

  return (
    <TooltipProvider>
      <section
        ref={containerRef}
        className="relative min-h-[100svh] min-h-dvh bg-[color:var(--solaris-void)] overflow-x-hidden lg:overflow-hidden flex flex-col justify-center items-center pt-20 pb-16 lg:pb-24 lg:pt-16"
      >
        {isDemoRoute ? (
          <div
            ref={demoCutRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[12] hidden lg:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(2,6,23,0.25) 18%, rgba(46,231,255,0.09) 46%, rgba(242,201,76,0.08) 62%, rgba(0,0,0,0) 100%)',
              mixBlendMode: 'screen',
              filter: 'blur(2px)',
            }}
          />
        ) : null}
        {isDemoRoute && cinematic && isDesktop && !isMobile && !isAutomated ? (
          <button
            type="button"
            aria-pressed={demoSound}
            aria-label="Toggle demo sound"
            onClick={() => {
              const next = !demoSound;
              setDemoSound(next);
              try {
                window.localStorage.setItem('solarisDemoSound', next ? '1' : '0');
              } catch {
                void 0;
              }
            }}
            className={[
              'absolute right-5 top-5 z-20 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur transition-colors',
              demoSound ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200' : 'border-white/15 bg-black/30 text-white/80 hover:bg-black/40',
            ].join(' ')}
          >
            SOUND {demoSound ? 'ON' : 'OFF'}
          </button>
        ) : null}
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
          aria-hidden
          style={{
            transform:
              'translate3d(var(--hero-parallax-x-px, 0px), calc(var(--hero-scroll-y-px, 0px) + var(--hero-parallax-y-px, 0px)), 0)',
          }}
        >
          {/* Layer 1 — fond de bază */}
          <div className="absolute inset-0 bg-[#020510]" />

          {allowWebglDecor ? (
            <div className="absolute inset-0 hidden sm:block">
              <QuantumFieldCanvas />
            </div>
          ) : null}

          {allowWebglDecor ? (
            <div className="absolute inset-0 hidden sm:block" style={{ mixBlendMode: 'screen', opacity: 0.75 }}>
              <SolarRaysCoinsCanvas />
            </div>
          ) : null}

          {/* Layer 2+3 mobile — gradient static optimizat */}
          <div className="absolute inset-0 sm:hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(242,201,76,0.16)_0%,transparent_55%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.08)_0%,transparent_50%)]" />
            <AppImage
              src="/solaris-cet-logo-emblem-190.webp"
              alt=""
              width="190"
              height="190"
              className="absolute right-[-20%] bottom-[-10%] w-[520px] max-w-none opacity-35 blur-[0.2px]"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </div>

          {/* Layer 4 — vignette gradient pentru lizibilitate text */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020510]/20 via-[#020510]/55 to-[#020510]" />

          {/* Layer 5 — grain cinematic */}
          <div
            className="absolute inset-0 hero-film-grain mix-blend-overlay hidden sm:block"
            style={{ opacity: 'calc(0.06 + (var(--demo-beat, 0) * 0.04))' }}
          />

          {/* Layer 6 — ambient quantum glow (CSS, fără JS) */}
          <div className="quantum-ambient-glow" aria-hidden />

          <div className="absolute inset-0 hidden sm:block hero-holo-grid" aria-hidden />
          <div className="absolute inset-0 hidden sm:block hero-holo-scanline" aria-hidden />
        </div>

        <Suspense fallback={null}>
          {enableHologram ? (
            hologramReady ? <HeroTokenHologram quality={holoQuality ?? undefined} seed={signatureSeed} /> : null
          ) : null}
        </Suspense>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 flex flex-col gap-12 lg:gap-16 pt-12 md:pt-16">
          
          <div
            ref={titleContainerRef}
            className="flex flex-col items-center text-center w-full max-w-4xl mx-auto"
            style={{
              filter: isDemoRoute
                ? 'drop-shadow(0 0 calc(26px * var(--demo-beat, 0)) rgba(46,231,255,0.28)) drop-shadow(0 0 calc(18px * var(--demo-beat, 0)) rgba(242,201,76,0.2))'
                : undefined,
            }}
          >
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-solaris-gold/25 bg-solaris-gold/10 quantum-badge text-solaris-gold text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-8 shadow-[0_0_18px_rgba(242,201,76,0.15)]">
               <span className="w-1.5 h-1.5 rounded-full bg-solaris-gold animate-pulse" />
               VIRTUAL AGRICULTURAL LAND · CETĂȚUIA · TON
            </div>

            <h1 className="font-display text-white leading-[1.02] tracking-[-0.04em] mb-5 drop-shadow-2xl type-h1">
              Un token ancorat într-un strat de{' '}
              <span className="text-gradient-aurora">teren agricol virtual</span>
              <span className="text-solaris-gold">
                {' '}
                — 9,000 <CetSymbol className="text-solaris-gold" />.
              </span>
              <span className="block text-white">Verificabil.</span>
            </h1>
            
            <p className="type-body text-slate-100/90 max-w-2xl font-medium mb-10 text-balance px-4">
              Strat virtual verificabil. Supply fix. Lichiditate on-chain. Dovezi publice pentru spec, map și rapoarte.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12 w-full sm:w-auto px-4">
              <div className="w-full sm:w-auto hero-cta-pulse">
                {tonConnectReady ? (
                  <Suspense fallback={null}>
                    <WalletConnect />
                  </Suspense>
                ) : (
                  <button
                    type="button"
                    className="ton-connect-btn w-full"
                    data-testid="wallet-connect-button"
                    onClick={() => enableTonConnect({ openModal: true })}
                  >
                    Connect Wallet
                  </button>
                )}
              </div>

              <a
                href="#whitepaper"
                className="hidden sm:inline-flex btn-gold glow-pulse-hover btn-quantum btn-quantum-float"
              >
                <FileText size={18} className="shrink-0" aria-hidden />
                Citește Whitepaper
              </a>
            </div>

            <a
              href="#whitepaper"
              className="sm:hidden inline-flex items-center gap-2 text-solaris-gold font-semibold text-sm underline underline-offset-4"
            >
              <FileText size={16} className="shrink-0" aria-hidden />
              Citește Whitepaper
            </a>

            <div
              data-testid="hero-quick-stats"
              className="hidden sm:grid grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl border border-white/10 py-6 px-5 bg-white/[0.03] backdrop-blur-xl rounded-3xl mb-6 shadow-2xl"
            >
              <AnimatedCounter
                value={stats.totalSupply}
                label="Supply total"
                suffix=" CET"
                labelClassName="text-[10px] md:text-xs text-solaris-gold/80 tracking-[0.2em] uppercase mt-2 font-medium"
              />

              {typeof pool.priceUsd === 'number' ? (
                <AnimatedCounter
                  value={pool.priceUsd}
                  label="Preț curent"
                  prefix="$"
                  decimals={6}
                  labelClassName="text-[10px] md:text-xs text-solaris-gold/80 tracking-[0.2em] uppercase mt-2 font-medium"
                />
              ) : (
                <div className="flex flex-col items-center group relative p-3 rounded-2xl transition-colors hover:bg-white/[0.02]">
                  <div className="text-3xl md:text-5xl font-black text-white tracking-tighter">—</div>
                  <div className="text-[10px] md:text-xs text-solaris-gold/80 tracking-[0.2em] uppercase mt-2 font-medium">
                    Preț curent
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {pool.error ? 'DeDust indisponibil' : 'Fără pereche activă'}
                  </div>
                </div>
              )}

              <AnimatedCounter
                value={community.telegramMembers}
                label="Holderi activi"
                labelClassName="text-[10px] md:text-xs text-solaris-gold/80 tracking-[0.2em] uppercase mt-2 font-medium"
                wrapperClassName="[&>div[title]]:cursor-help"
                meshTitleKey="Proxy: comunitate Telegram"
              />

              <div className="col-span-3 flex items-center justify-center gap-8 text-xs text-slate-300/90">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden />
                  <span>TON</span>
                </span>
                <a
                  href="#authority-trust"
                  className="text-solaris-gold font-semibold hover:text-solaris-gold/90 underline underline-offset-4"
                >
                  Cetățuia
                </a>
              </div>
            </div>

            <div
              data-testid="hero-next-steps"
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 w-full max-w-4xl px-4"
            >
              <a
                href={DEDUST_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
              >
                DeDust
              </a>
              <a
                href="#staking"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
              >
                Tokenomics
              </a>
              <a
                href="#how-to-buy"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors btn-quantum"
              >
                How to Buy
              </a>
            </div>

            <div id="cet-ai" className="w-full mt-6 px-4">
              {cetAiReady ? (
                <Suspense fallback={null}>
                  <CetAiSearch />
                </Suspense>
              ) : null}
            </div>

            

            {/* Trust Badges under CTA */}
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 opacity-80 mb-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors cursor-help">
                    <ShieldCheck size={20} />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Auditat Cyberscope</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Audit securitate complet, 0 vulnerabilități.</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors cursor-help">
                    <TrendingUp size={20} />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Listed DeDust</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Inclus pe exchange-ul descentralizat DeDust.</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors cursor-help">
                    <CheckCircle size={20} />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Built on TON</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Construit pe ecosistemul The Open Network.</TooltipContent>
              </Tooltip>
            </div>
            
          </div>
        </div>

        {/* Scroll Indicator Animat */}
        <div className="hidden lg:flex absolute bottom-[100px] left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none opacity-60 animate-[pulse_3s_ease-in-out_infinite]">
           <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-teal-400">Scroll to Explore</span>
           <ChevronDown size={20} className="animate-bounce text-teal-400" />
        </div>

        {/* Live Ticker Area */}
        <div
          ref={tickerContainerRef}
          role="region"
          aria-label={t.hero.liveTickerAria}
          className="relative lg:absolute lg:bottom-0 w-full overflow-hidden py-4 md:py-6 border-t border-white/10 bg-slate-950/80 backdrop-blur-2xl mt-6 lg:mt-0 shadow-[0_-24px_80px_-28px_rgba(46,231,255,0.07)]"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10 sm:w-16 bg-gradient-to-r from-[color:var(--solaris-void)] to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 sm:w-16 bg-gradient-to-l from-[color:var(--solaris-void)] to-transparent" aria-hidden />
          <div
            className={
              tickerExpanded
                ? 'flex min-w-max animate-ticker whitespace-nowrap group/ticker'
                : 'flex min-w-max whitespace-nowrap'
            }
          >
            {(tickerExpanded ? [...tickerRows, ...tickerRows] : tickerRows.slice(0, 10)).map((item, i) => (
              <div
                key={`${lang}-ticker-${item.label}-${i}`}
                className="inline-flex items-center px-6 sm:px-8 md:px-10 gap-3 md:gap-4 group/item transition-opacity duration-300 hover:!opacity-100 group-hover/ticker:opacity-50"
              >
                <span className="text-[10px] text-zinc-500 font-mono transition-colors group-hover/item:text-teal-400/70">{item.label}</span>
                <span className="text-teal-400 font-bold text-sm transition-transform duration-300 group-hover/item:scale-105">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </section>
    </TooltipProvider>
  );
};

export default React.memo(HeroSection);
