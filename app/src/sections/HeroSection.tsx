import React, { useRef, useLayoutEffect, useState, useCallback, memo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Zap, Activity, Loader2 } from 'lucide-react';

import ParticleCanvas from '../components/ParticleCanvas';
import AiOracleSearch from '../components/AiOracleSearch';
import {
  TooltipProvider
} from '../components/ui/tooltip';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';

// --- CONSTANTS & CONFIGURATION ---
const APP_CONFIG = {
  LINKS: {
    LOGO: `${import.meta.env.BASE_URL}icon-192.png`,
    DEDUST_POOL: 'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB/deposit',
    TELEGRAM_BOT: 'https://t.me/+tKlfzx7IWopmNWQ0',
    BITCOIN_LOGO: `${import.meta.env.BASE_URL}bitcoin-logo.svg`,
    HERO_COIN: `${import.meta.env.BASE_URL}hero-coin.png`
  },
  TIMING: {
    PROCESSING: 2000,
    SUCCESS_DISPLAY: 3000
  }
} as const;

const TICKER_DATA = [
  { label: 'SUPPLY', value: '9,000 CET' },
  { label: 'NETWORK', value: 'TON' },
  { label: 'MAX TPS', value: '100,000' },
  { label: 'FINALITY', value: '2.0s' },
  { label: 'POOL', value: 'DeDust' },
  { label: 'MINING', value: '90 YEARS' }
];

// --- SUB-COMPONENTS (Optimized via Memoization) ---
const StatRow = memo(({ label, value, colorClass = "text-solaris-gold" }: { label: string, value: string, colorClass?: string }) => (
  <div className="flex justify-between items-center group/stat">
    <span className="text-solaris-muted text-sm group-hover/stat:text-white transition-colors">{label}</span>
    <span className={`font-mono ${colorClass} text-lg font-semibold tracking-tighter`}>{value}</span>
  </div>
));
StatRow.displayName = 'StatRow';

const HeroSection: React.FC = () => {
  // --- REFS ENGINE ---
  const containerRef = useRef<HTMLDivElement>(null);
  const coinWrapperRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const hudWrapperRef = useRef<HTMLDivElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const oracleWrapperRef = useRef<HTMLDivElement>(null); // CRITICAL: Fix for line 470
  const tickerContainerRef = useRef<HTMLDivElement>(null);
  
  const [miningState, setMiningState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const prefersReducedMotion = useReducedMotion();
  const { t } = useLanguage();

  // --- BUSINESS LOGIC ---
  const handleMiningOperation = useCallback(async () => {
    if (miningState !== 'IDLE') return;
    setMiningState('PROCESSING');
    
    await new Promise(resolve => setTimeout(resolve, APP_CONFIG.TIMING.PROCESSING));
    setMiningState('SUCCESS');
    window.open(APP_CONFIG.LINKS.TELEGRAM_BOT, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => setMiningState('IDLE'), APP_CONFIG.TIMING.SUCCESS_DISPLAY);
  }, [miningState]);

  // --- ANIMATION CORE (GSAP) ---
  useLayoutEffect(() => {
    // Skip GSAP animations on mobile (< 768px) or when the user has requested
    // reduced motion via their OS/browser accessibility settings.  Both cases
    // leave all elements at their natural visible state to prevent a blank
    // screen caused by `fromTo opacity: 0`.
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 767px)').matches;

    if (isMobile || prefersReducedMotion) {
      // Ensure elements are fully visible without inline-style overrides
      // (no GSAP "from" state is applied, so they remain visible by default).
      const els: (HTMLElement | null)[] = [
        coinWrapperRef.current,
        titleContainerRef.current,
        hudWrapperRef.current,
        tickerContainerRef.current,
      ];
      els.forEach(el => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      if (oracleWrapperRef.current) {
        oracleWrapperRef.current.style.opacity = '1';
        oracleWrapperRef.current.style.width = '100%';
      }
      return;
    }

    const ctx = gsap.context(() => {
      const mainTl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });

      // Intro Sequence
      mainTl
        .fromTo(coinWrapperRef.current, { scale: 0.5, opacity: 0, rotateY: -45 }, { scale: 1, opacity: 1, rotateY: 0, duration: 1.5 })
        .fromTo([titleContainerRef.current, hudWrapperRef.current], { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.2 }, "-=1")
        .fromTo(oracleWrapperRef.current, { width: "0%", opacity: 0 }, { width: "100%", opacity: 1, duration: 0.8 }, "-=0.5")
        .fromTo(tickerContainerRef.current, { y: 100 }, { y: 0 }, "-=0.5");

      // Scroll Orchestration (desktop only)
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: 1,
        animation: gsap.timeline()
          .to(coinWrapperRef.current, { x: "-25vw", rotateY: 90, opacity: 0 })
          .to(titleContainerRef.current, { x: "-100%", opacity: 0 }, 0)
          .to(hudWrapperRef.current, { x: "100%", opacity: 0 }, 0)
          .to(oracleWrapperRef.current, { y: 40, opacity: 0 }, 0)
      });
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // --- RENDER ---
  return (
    <TooltipProvider>
      <section 
        ref={containerRef}
        className="relative min-h-screen bg-[#020202] overflow-hidden flex flex-col justify-center items-center"
      >
        {/* Background Layer (Hardware Accelerated) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <ParticleCanvas count={120} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,201,76,0.05),transparent)]" />
        </div>

        <div className="w-full max-w-7xl mx-auto relative z-10 px-6 lg:px-8 flex flex-col gap-6">
          {/* 3-column grid: title | coin | HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: ARCHITECTURE TITLE */}
          <div ref={titleContainerRef} className="lg:col-span-5 flex flex-col justify-center">
            <div className="glass-card-gold p-8 rounded-3xl border border-yellow-500/20 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-6">
                <img src={APP_CONFIG.LINKS.LOGO} className="w-16 h-16 rounded-2xl shadow-[0_0_30px_rgba(242,201,76,0.3)]" alt="Solaris" />
                <h1 className="text-5xl font-black tracking-tighter text-white">SOLARIS <span className="text-yellow-500">CET</span></h1>
              </div>
              
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {t.hero.description}
              </p>

              <div ref={ctaGroupRef} className="flex flex-wrap gap-4">
                <button 
                  onClick={handleMiningOperation}
                  aria-live="polite"
                  aria-busy={miningState === 'PROCESSING'}
                  aria-label={miningState === 'IDLE' ? 'Start mining' : miningState === 'PROCESSING' ? 'Processing mining operation' : 'Mining initiated successfully'}
                  className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-2xl hover:scale-105 transition-transform flex items-center gap-2"
                >
                  {miningState === 'IDLE' ? <><Zap size={20} /> {t.hero.startMining}</> : <Loader2 className="animate-spin" />}
                </button>
                <a
                  href="#whitepaper"
                  className="px-8 py-4 border border-gray-700 text-white font-bold rounded-2xl hover:bg-white/5 transition-colors"
                >
                  {t.hero.docs}
                </a>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: 3D ASSET */}
          <div className="lg:col-span-2 flex justify-center items-center">
             <div ref={coinWrapperRef} className="relative w-64 h-64 lg:w-96 lg:h-96">
                <img src={APP_CONFIG.LINKS.HERO_COIN} className="w-full h-full object-contain animate-pulse" alt="CET Token" />
                <div className="absolute inset-0 bg-yellow-500/20 blur-[120px] rounded-full" />
             </div>
          </div>

          {/* RIGHT COLUMN: TELEMETRY HUD */}
          <div ref={hudWrapperRef} className="lg:col-span-5 flex flex-col justify-center">
            <div className="glass-card p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-8 text-yellow-500 font-mono text-sm tracking-widest">
                <Activity size={16} /> NETWORK TELEMETRY
              </div>
              
              <div className="space-y-6">
                <StatRow label="THROUGHPUT" value="~100,000 TPS" />
                <div className="h-px bg-white/5 w-full" />
                <StatRow label="LATENCY" value="2.0s" colorClass="text-cyan-400" />
                <div className="h-px bg-white/5 w-full" />
                <StatRow label="NODES" value="ACTIVE [300+]" colorClass="text-white" />
              </div>

              <div className="mt-12 h-24 w-full bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-end">
                   {/* Simplified Dynamic Wave Visualizer */}
                   <div className="w-full h-full bg-gradient-to-t from-yellow-500/10 to-transparent" />
                </div>
              </div>
            </div>
          </div>
          </div>{/* end 3-column grid */}

          {/* AI ORACLE INTEGRATION — full width below the 3-column grid */}
          <div ref={oracleWrapperRef} className="w-full transform-gpu overflow-hidden">
            <AiOracleSearch />
          </div>
        </div>

        {/* FOOTER TICKER */}
        <div ref={tickerContainerRef} className="absolute bottom-0 w-full py-6 border-t border-white/5 bg-black/80 backdrop-blur-lg">
           <div className="flex animate-ticker whitespace-nowrap">
              {[...TICKER_DATA, ...TICKER_DATA].map((item, i) => (
                <div key={i} className="inline-flex items-center px-12 gap-4">
                  <span className="text-[10px] text-gray-500 font-mono">{item.label}</span>
                  <span className="text-yellow-500 font-bold">{item.value}</span>
                </div>
              ))}
           </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default memo(HeroSection);
