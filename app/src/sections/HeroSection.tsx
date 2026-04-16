import React, { lazy, Suspense, useRef, useLayoutEffect, useMemo, memo, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ShieldCheck, TrendingUp, CheckCircle, ChevronDown, FileText } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCetSupplyWithSuffix, formatTaskAgentMeshHeadline } from '@/lib/numerals';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { TonConnectButton } from '@tonconnect/ui-react';
import SolarRaysCoinsCanvas from '../components/SolarRaysCoinsCanvas';
import QuantumFieldCanvas from '../components/QuantumFieldCanvas';
import AnimatedCounter from '../components/AnimatedCounter';
import { useLivePoolData } from '@/hooks/use-live-pool-data';
import { useCommunityProof } from '@/hooks/use-community-proof';
import CetAiSearch from '../components/CetAiSearch';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';

const HeroTokenHologram = lazy(() => import('@/experience/HeroTokenHologram'));

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

  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { t, lang } = useLanguage();
  const pool = useLivePoolData();
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

  const enableHologram = useMemo(() => {
    if (!cinematic) return false;
    if (prefersReducedMotion) return false;
    if (!isDesktop) return false;
    const navAny =
      typeof navigator !== 'undefined'
        ? (navigator as unknown as { connection?: { saveData?: boolean }; deviceMemory?: number })
        : null;
    const saveData = navAny?.connection?.saveData === true;
    const dm = typeof navAny?.deviceMemory === 'number' ? navAny.deviceMemory : null;
    const okMem = dm === null ? true : dm >= 4;
    return !saveData && okMem;
  }, [cinematic, prefersReducedMotion, isDesktop]);

  useLayoutEffect(() => {
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

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

    const ctx = gsap.context(() => {
      const mainTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.1 } });

      mainTl
        .fromTo(titleContainerRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, 0.2)
        .fromTo(tickerContainerRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6');
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

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
    if (prefersReducedMotion) return;
    const bg = backgroundRef.current;
    if (!bg) return;
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.max(-160, -window.scrollY * 0.3);
      bg.style.transform = `translate3d(0, ${y}px, 0)`;
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
      bg.style.transform = '';
    };
  }, [prefersReducedMotion]);

  return (
    <TooltipProvider>
      <section
        ref={containerRef}
        className="relative min-h-dvh bg-[color:var(--solaris-void)] overflow-x-hidden lg:overflow-hidden flex flex-col justify-center items-center pt-20 pb-16 lg:pb-24 lg:pt-16"
      >
        <div ref={backgroundRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none will-change-transform" aria-hidden>
          {/* Layer 1 — fond de bază */}
          <div className="absolute inset-0 bg-[#020510]" />

          {/* Layer 2 — Quantum field (stele + particule cyan/magenta + entanglement) — desktop only */}
          <div className="absolute inset-0 hidden sm:block">
            <QuantumFieldCanvas />
          </div>

          {/* Layer 3 — Solar rays + coins aurii — desktop, blended peste quantum */}
          <div className="absolute inset-0 hidden sm:block" style={{ mixBlendMode: 'screen', opacity: 0.75 }}>
            <SolarRaysCoinsCanvas />
          </div>

          {/* Layer 2+3 mobile — gradient static optimizat */}
          <div className="absolute inset-0 sm:hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(242,201,76,0.16)_0%,transparent_55%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.08)_0%,transparent_50%)]" />
            <img
              src="/hero-coin.png"
              alt=""
              className="absolute right-[-20%] bottom-[-10%] w-[520px] max-w-none opacity-35 blur-[0.2px]"
              loading="eager"
              decoding="async"
            />
          </div>

          {/* Layer 4 — vignette gradient pentru lizibilitate text */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020510]/20 via-[#020510]/55 to-[#020510]" />

          {/* Layer 5 — grain cinematic */}
          <div className="absolute inset-0 opacity-[0.06] hero-film-grain mix-blend-overlay hidden sm:block" />

          {/* Layer 6 — ambient quantum glow (CSS, fără JS) */}
          <div className="quantum-ambient-glow" aria-hidden />

          <div className="absolute inset-0 hidden sm:block hero-holo-grid" aria-hidden />
          <div className="absolute inset-0 hidden sm:block hero-holo-scanline" aria-hidden />
        </div>

        <Suspense fallback={null}>{enableHologram ? <HeroTokenHologram /> : null}</Suspense>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 flex flex-col gap-12 lg:gap-16 pt-12 md:pt-16">
          
          <div ref={titleContainerRef} className="flex flex-col items-center text-center w-full max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-solaris-gold/25 bg-solaris-gold/10 quantum-badge text-solaris-gold text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-8 shadow-[0_0_18px_rgba(242,201,76,0.15)]">
               <span className="w-1.5 h-1.5 rounded-full bg-solaris-gold animate-pulse" />
               RWA · CETĂȚUIA ROMÂNIEI · TON
            </div>

            <h1 className="font-display text-white leading-[1.02] tracking-[-0.04em] mb-5 drop-shadow-2xl type-h1">
              Primul token RWA ancorat în{' '}
              <span className="text-gradient-aurora">Cetățuia, România</span>
              <span className="text-solaris-gold"> — 9,000 CET.</span>
              <span className="block text-white">Imutabil.</span>
            </h1>
            
            <p className="type-body text-slate-100/90 max-w-2xl font-medium mb-10 text-balance px-4">
              Activ real. Supply fix. Lichiditate on-chain. Un token care nu se confundă cu mii de imitații.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10 sm:mb-12 w-full sm:w-auto px-4">
              <div className="w-full sm:w-auto hero-cta-pulse">
                <TonConnectButton className="ton-connect-btn" />
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
              <CetAiSearch />
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
          <div className="flex min-w-max animate-ticker whitespace-nowrap group/ticker">
            {[...tickerRows, ...tickerRows].map((item, i) => (
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

export default memo(HeroSection);
