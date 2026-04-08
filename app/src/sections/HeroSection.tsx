import React, { useRef, useLayoutEffect, useMemo, memo, lazy, Suspense } from 'react';
import { gsap } from 'gsap';
import { Zap, ShieldCheck, TrendingUp, CheckCircle, ChevronDown, Rocket } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';
import { formatCetSupplyWithSuffix, formatTaskAgentMeshHeadline } from '@/lib/numerals';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';

const NetworkNodesCanvas = lazy(() => import('../components/NetworkNodesCanvas'));
import CetAiSearch from '../components/CetAiSearch';
import { TypewriterTitle } from '../components/TypewriterTitle';
import AnimatedCounter from '../components/AnimatedCounter';

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

const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const cetAiWrapperRef = useRef<HTMLDivElement>(null);
  const tickerContainerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReducedMotion();
  const { t, lang } = useLanguage();

  const tickerRows = useMemo(() => {
    const supply = formatCetSupplyWithSuffix(lang);
    const agents = formatTaskAgentMeshHeadline(lang);
    return TICKER_DATA.map((row) => {
      if (row.label === 'SUPPLY') return { ...row, value: supply };
      if (row.label === 'AI AGENTS') return { ...row, value: agents };
      return row;
    });
  }, [lang]);

  useLayoutEffect(() => {
    const isMobile =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

    if (isMobile || prefersReducedMotion) {
      if (titleContainerRef.current) {
        titleContainerRef.current.style.opacity = '1';
        titleContainerRef.current.style.transform = 'none';
      }
      if (cetAiWrapperRef.current) {
        cetAiWrapperRef.current.style.opacity = '1';
        cetAiWrapperRef.current.style.transform = 'none';
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
        .fromTo(cetAiWrapperRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.5')
        .fromTo(tickerContainerRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6');
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <TooltipProvider>
      <section
        ref={containerRef}
        className="relative min-h-dvh bg-slate-950 overflow-x-hidden lg:overflow-hidden flex flex-col justify-center items-center pt-20 pb-16 lg:pb-24 lg:pt-16"
      >
        {/* Deep Space Background & TON Nodes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[#020510]" />
          
          {/* Subtle deep space glows */}
          <div className="absolute w-[100vw] h-[100vw] rounded-full blur-[160px] opacity-20 bg-[radial-gradient(circle,#2ee7ff_0%,transparent_60%)] -top-1/4 -left-1/4" />
          <div className="absolute w-[100vw] h-[100vw] rounded-full blur-[160px] opacity-10 bg-[radial-gradient(circle,#f2c94c_0%,transparent_70%)] -bottom-1/4 -right-1/4" />

          {/* Canvas Nodes Animation */}
          <Suspense fallback={null}>
            <NetworkNodesCanvas />
          </Suspense>

          <div className="absolute inset-0 opacity-10 hero-film-grain mix-blend-overlay" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 xl:px-12 flex flex-col gap-12 lg:gap-16 pt-12 md:pt-16">
          
          <div ref={titleContainerRef} className="flex flex-col items-center text-center w-full max-w-4xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(46,231,255,0.15)]">
               <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
               Rețeaua TON Inovatoare
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter mb-6 drop-shadow-2xl h-[120px] sm:h-[140px] md:h-[180px] lg:h-[200px] flex items-center justify-center">
              <TypewriterTitle phrases={['SOLARIS CET', 'THE AI RWA TOKEN', 'INNOVATION ON TON']} />
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed mb-10 text-balance px-4">
              Primul proiect RWA condus de {formatTaskAgentMeshHeadline(lang)} agenți AI complet autonomi. 
              Inovație hibridă. Execuție descentralizată. Construit pentru performanță extremă.
            </p>

            {/* Custom CTA Buttons with precise requests */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16 w-full sm:w-auto px-4">
              <a
                href={DEDUST_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-xl bg-teal-500 text-slate-950 font-bold text-base md:text-lg tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_35px_-5px_rgba(46,231,255,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  <Zap size={20} className="stroke-[2.5]" /> Cumpără CET
                </span>
              </a>

              <a
                href="#whitepaper"
                className="group flex items-center justify-center w-full sm:w-auto h-14 px-8 rounded-xl border-2 border-teal-500/50 bg-transparent text-white font-bold text-base md:text-lg tracking-wide transition-all duration-300 hover:bg-teal-500/10 hover:border-teal-400 hover:-translate-y-1 hover:shadow-[0_10px_35px_-5px_rgba(46,231,255,0.15)]"
              >
                <Rocket size={20} className="mr-2" />
                Citește Whitepaper
              </a>
            </div>

            {/* Animated Counters Subtitle Area */}
            <div
              data-testid="hero-quick-stats"
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-16 w-full max-w-4xl border-y border-white/5 py-8 bg-white/[0.01] backdrop-blur-md rounded-3xl mb-6 shadow-2xl"
            >
              <AnimatedCounter value={9000} label="Total Supply" suffix=" CET" />
              <AnimatedCounter value={214500} label="Market Cap" prefix="$" />
              <AnimatedCounter value={200000} label="AI Agents" />
              <div className="sm:col-span-3 flex flex-wrap justify-center items-center gap-3 sm:gap-4 opacity-90 mt-2">
                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-solaris-muted">
                  TON
                </div>
                <a
                  href="#authority-trust"
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-solaris-muted hover:text-solaris-text hover:bg-white/10 transition-colors"
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
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                DeDust
              </a>
              <a
                href="#staking"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Tokenomics
              </a>
              <a
                href="#how-to-buy"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                How to Buy
              </a>
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

          <div id="cet-ai" ref={cetAiWrapperRef} className="w-full transform-gpu overflow-hidden scroll-mt-24">
            <CetAiSearch />
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
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10 sm:w-16 bg-gradient-to-r from-[#020510] to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 sm:w-16 bg-gradient-to-l from-[#020510] to-transparent" aria-hidden />
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
