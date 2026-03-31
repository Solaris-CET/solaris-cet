import React, { useRef, useLayoutEffect, useState, useCallback, memo, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { Zap, Activity, Loader2 } from 'lucide-react';

const ParticleCanvas = lazy(() => import('../components/ParticleCanvas'));
import GlowOrbs from '../components/GlowOrbs';
import CetAiSearch from '../components/CetAiSearch';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { SolarisLogoMark } from '../components/SolarisLogoMark';
import { TooltipProvider } from '../components/ui/tooltip';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';

const APP_CONFIG = {
  LINKS: {
    LOGO: `${import.meta.env.BASE_URL}icon-192.png`,
    TELEGRAM_BOT: 'https://t.me/+tKlfzx7IWopmNWQ0',
    HERO_COIN: `${import.meta.env.BASE_URL}hero-coin.png`,
  },
  TIMING: {
    PROCESSING: 2000,
    SUCCESS_DISPLAY: 3000,
  },
} as const;

const WAVE_BAR_HEIGHTS = [
  0.4, 0.7, 0.5, 0.9, 0.6,
  1.0, 0.8, 0.7, 0.5, 0.9,
  0.6, 1.0, 0.8, 0.4, 0.7,
  0.5, 0.9, 0.6, 1.0, 0.8,
] as const;

const TICKER_DATA = [
  { label: 'AI AGENTS', value: '200,000+' },
  { label: 'SUPPLY', value: '9,000 CET' },
  { label: 'NETWORK', value: 'TON' },
  { label: 'MAX TPS', value: '100,000' },
  { label: 'FINALITY', value: '2.0s' },
  { label: 'POOL', value: 'DeDust' },
  { label: 'MINING', value: '90 YEARS' },
  { label: 'DEPARTMENTS', value: '10' },
  { label: 'UPTIME', value: '24/7' },
  { label: 'AUDIT', value: 'CYBERSCOPE' },
  { label: 'CHAIN', value: 'MAINNET' },
  { label: 'PROTOCOL', value: 'RAV v3.0' },
  { label: 'DUAL-AI', value: 'GROK × GEMINI' },
  { label: 'RWA BACKING', value: 'CETĂȚUIA, RO' },
];

const StatRow = memo(
  ({ label, value, colorClass = 'text-solaris-gold' }: { label: string; value: string; colorClass?: string }) => (
    <div className="flex justify-between items-center gap-4 group/stat">
      <span className="text-solaris-muted text-xs sm:text-sm group-hover/stat:text-white transition-colors">{label}</span>
      <span className={`font-mono ${colorClass} text-sm sm:text-base font-semibold tracking-tighter shrink-0`}>{value}</span>
    </div>
  ),
);
StatRow.displayName = 'StatRow';

const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const coinWrapperRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const hudWrapperRef = useRef<HTMLDivElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const cetAiWrapperRef = useRef<HTMLDivElement>(null);
  const tickerContainerRef = useRef<HTMLDivElement>(null);

  const [miningState, setMiningState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();

  const handleMiningOperation = useCallback(async () => {
    if (miningState !== 'IDLE') return;
    setMiningState('PROCESSING');

    await new Promise((resolve) => setTimeout(resolve, APP_CONFIG.TIMING.PROCESSING));
    setMiningState('SUCCESS');
    window.open(APP_CONFIG.LINKS.TELEGRAM_BOT, '_blank', 'noopener,noreferrer');

    setTimeout(() => setMiningState('IDLE'), APP_CONFIG.TIMING.SUCCESS_DISPLAY);
  }, [miningState]);

  useLayoutEffect(() => {
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    if (isMobile || prefersReducedMotion) {
      const els: (HTMLElement | null)[] = [
        coinWrapperRef.current,
        titleContainerRef.current,
        hudWrapperRef.current,
        ctaGroupRef.current,
        tickerContainerRef.current,
      ];
      els.forEach((el) => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      if (cetAiWrapperRef.current) {
        cetAiWrapperRef.current.style.opacity = '1';
        cetAiWrapperRef.current.style.width = '100%';
      }
      return;
    }

    const ctx = gsap.context(() => {
      /** One-shot entrance only — no pin/scrub (scroll-jacking reads as cheap and hurts UX). */
      const mainTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.95 } });

      mainTl
        .fromTo(coinWrapperRef.current, { scale: 0.94, rotateY: -8, opacity: 0 }, { scale: 1, rotateY: 0, opacity: 1, duration: 1.1 })
        .fromTo([titleContainerRef.current, hudWrapperRef.current], { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 }, '-=0.72')
        .fromTo(
          cetAiWrapperRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out' },
          '-=0.5',
        )
        .fromTo(tickerContainerRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65 }, '-=0.4');
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <TooltipProvider>
      <section
        ref={containerRef}
        className="relative min-h-screen bg-slate-950 overflow-x-hidden lg:overflow-hidden flex flex-col justify-center items-center"
      >
        {/* Ambient background: gradient mesh + orbs + particles */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 sm:hidden"
            style={{
              background:
                'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(255,215,140,0.18), transparent 52%), radial-gradient(circle at 18% 22%, rgba(46,231,255,0.08), transparent 46%), linear-gradient(180deg, #0a0a0b 0%, #09090b 50%, #030305 100%)',
            }}
          />
          <div
            className="hidden sm:block absolute inset-0 opacity-90"
            style={{
              background:
                'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(234,179,8,0.14), transparent 55%), radial-gradient(ellipse 90% 60% at 100% 50%, rgba(46,231,255,0.06), transparent 50%), linear-gradient(180deg, #050506 0%, #09090b 45%, #030305 100%)',
            }}
          />

          {/* Slow-moving gold “light” blobs */}
          <div
            className="absolute w-[min(120vw,1400px)] h-[min(120vw,1400px)] rounded-full blur-[100px] opacity-[0.35] animate-hero-aurora"
            style={{
              left: '15%',
              top: '5%',
              background: 'radial-gradient(circle, rgba(250,204,21,0.45) 0%, rgba(234,179,8,0.12) 38%, transparent 68%)',
            }}
          />
          <div
            className="absolute w-[min(90vw,900px)] h-[min(90vw,900px)] rounded-full blur-[90px] opacity-[0.25] animate-hero-aurora [animation-delay:-14s]"
            style={{
              right: '-5%',
              bottom: '10%',
              background: 'radial-gradient(circle, rgba(253,224,71,0.25) 0%, rgba(202,138,4,0.08) 42%, transparent 70%)',
            }}
          />

          <GlowOrbs variant="gold" className="opacity-[0.68]" />

          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-screen animate-hero-conic-drift"
            style={{
              background:
                'conic-gradient(from 200deg at 50% 40%, transparent 0deg, rgba(234,179,8,0.05) 60deg, transparent 120deg, rgba(46,231,255,0.03) 200deg, transparent 280deg)',
            }}
          />

          <Suspense fallback={null}>
            <ParticleCanvas count={56} className="hidden sm:block opacity-[0.45]" connectionRadius={110} />
          </Suspense>

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_0%,rgba(255,200,120,0.1),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/90" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl section-padding-x xl:px-12 flex flex-col gap-8 lg:gap-10 pb-16 lg:pb-24 pt-24 lg:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10 xl:gap-12 items-center gap-10">
            {/* Center column: headline + CTAs */}
            <div
              ref={titleContainerRef}
              className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1"
            >
              <div className="mb-4 md:mb-5 flex flex-col items-center lg:items-start gap-3 w-full">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span
                    className="hidden sm:flex w-10 h-10 md:w-11 md:h-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_0_20px_rgba(242,201,76,0.1)] p-2"
                    aria-hidden
                  >
                    <SolarisLogoMark className="drop-shadow-[0_0_10px_rgba(242,201,76,0.4)]" />
                  </span>
                  <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-yellow-500/90 text-center lg:text-left leading-snug">
                    {t.hero.tagline}
                  </p>
                </div>
                <div
                  className="h-px w-full max-w-md mx-auto lg:mx-0 bg-gradient-to-r from-transparent via-solaris-gold/40 to-transparent opacity-90"
                  aria-hidden
                />
              </div>

              <h1 className="w-full font-black tracking-[-0.045em] leading-[0.92] text-balance">
                <span className="block text-5xl sm:text-6xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-[#FFF8E7] via-[#F2C94C] to-[#A67C00] drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]">
                  SOLARIS CET
                </span>
              </h1>

              <p className="mt-5 md:mt-6 max-w-xl text-base sm:text-lg md:text-xl text-white/90 font-medium leading-snug">
                {t.hero.subtitle}
              </p>

              <p className="mt-4 max-w-[52ch] text-sm sm:text-base text-solaris-muted leading-relaxed">
                {t.hero.description}
              </p>

              <div className="mt-8 md:mt-10 w-full max-w-xl mx-auto lg:mx-0">
                <div
                  ref={ctaGroupRef}
                  className="rounded-2xl md:rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] p-4 md:p-6 flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 justify-center lg:justify-start ring-1 ring-white/5"
                >
                  <button
                    type="button"
                    onClick={handleMiningOperation}
                    aria-live="polite"
                    aria-busy={miningState === 'PROCESSING'}
                    aria-label={
                      miningState === 'IDLE'
                        ? t.hero.miningStartAria
                        : miningState === 'PROCESSING'
                          ? t.hero.miningProcessingAria
                          : t.hero.miningSuccessAria
                    }
                    className="group relative w-full md:w-auto min-h-[52px] px-8 py-4 rounded-2xl bg-gradient-to-br from-[#F2C94C] to-[#D4AF37] text-slate-950 font-bold text-sm md:text-base tracking-wide shadow-[0_0_28px_rgba(234,179,8,0.35)] transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(250,204,21,0.55),0_0_100px_rgba(234,179,8,0.28)] hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2.5 overflow-hidden"
                  >
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-yellow-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    {miningState === 'IDLE' ? (
                      <>
                        <Zap size={20} className="shrink-0" strokeWidth={2.25} />
                        {t.hero.startMining}
                      </>
                    ) : (
                      <Loader2 className="animate-spin" size={22} />
                    )}
                  </button>

                  <a
                    href="#whitepaper"
                    className="w-full md:w-auto min-h-[52px] px-8 py-4 rounded-2xl border border-white/20 bg-white/[0.06] text-white font-semibold text-sm md:text-base text-center backdrop-blur-md transition-all duration-300 hover:bg-white/[0.1] hover:border-yellow-500/40 hover:text-white"
                  >
                    {t.hero.docs}
                  </a>
                </div>
              </div>
            </div>

            {/* Coin + glow */}
            <div className="lg:col-span-2 flex justify-center order-1 lg:order-2">
              <div
                ref={coinWrapperRef}
                className="relative w-40 h-40 sm:w-48 sm:h-52 md:w-56 md:h-60 lg:w-64 lg:h-64 xl:w-72 xl:h-72 [perspective:800px]"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-[130%] h-[130%] rounded-full bg-yellow-400/18 blur-[100px]" />
                  <img
                    src={APP_CONFIG.LINKS.HERO_COIN}
                    className="relative z-[1] w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                    alt="CET Token"
                  />
                </div>
              </div>
            </div>

            {/* Telemetry */}
            <div ref={hudWrapperRef} className="lg:col-span-3 order-3 w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
              <div className="glass-card-gold p-6 sm:p-7 rounded-3xl border border-yellow-500/20 shadow-[0_0_80px_-24px_rgba(234,179,8,0.25)]">
                <div className="flex items-center gap-2 mb-6 text-yellow-500 font-mono text-[11px] sm:text-xs tracking-[0.2em]">
                  <Activity size={14} strokeWidth={2.5} />
                  NETWORK TELEMETRY
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <StatRow label="TASK AGENTS (ROUTING)" value="200,000+" colorClass="text-yellow-500" />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                  <StatRow label="THROUGHPUT" value="~100,000 TPS" />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                  <StatRow label="LATENCY" value="2.0s" colorClass="text-cyan-400" />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full" />
                  <StatRow label="NODES" value="ACTIVE [300+]" colorClass="text-white" />
                </div>

                <MeshSkillRibbon
                  variant="compact"
                  saltOffset={340}
                  className="mt-5 border-fuchsia-500/12 bg-fuchsia-500/[0.04]"
                />

                <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-solaris-muted">
                  <span>HASHRATE MONITOR</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    LIVE
                  </span>
                </div>
                <div className="mt-2 h-14 sm:h-16 w-full bg-black/50 rounded-2xl border border-white/[0.06] overflow-hidden flex items-end gap-px px-2 pb-1.5">
                  {WAVE_BAR_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      className="wave-bar flex-1 text-solaris-gold"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div id="cet-ai" ref={cetAiWrapperRef} className="w-full transform-gpu overflow-hidden scroll-mt-24">
            <CetAiSearch />
          </div>
        </div>

        <div
          ref={tickerContainerRef}
          className="relative lg:absolute lg:bottom-0 w-full overflow-hidden py-4 md:py-6 border-t border-white/10 bg-slate-950/75 backdrop-blur-2xl mt-6 lg:mt-0 shadow-[0_-24px_80px_-28px_rgba(255,200,100,0.07)]"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10 sm:w-16 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 sm:w-16 bg-gradient-to-l from-slate-950 via-slate-950/90 to-transparent"
            aria-hidden
          />
          <div className="flex min-w-max animate-ticker whitespace-nowrap">
            {[...TICKER_DATA, ...TICKER_DATA].map((item, i) => (
              <div key={i} className="inline-flex items-center px-6 sm:px-8 md:px-10 gap-3 md:gap-4">
                <span className="text-[10px] text-zinc-500 font-mono">{item.label}</span>
                <span className="text-yellow-500 font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default memo(HeroSection);
