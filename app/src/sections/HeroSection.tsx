import { useEffect, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Zap, Activity, Globe, Loader2, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';

import ParticleCanvas from '../components/ParticleCanvas';
import GlowOrbs from '../components/GlowOrbs';
import AiOracleSearch from '../components/AiOracleSearch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip';

type MiningState = 'IDLE' | 'PROCESSING' | 'SUCCESS';

const SOLARIS_LOGO_URL = `${import.meta.env.BASE_URL}icon-192.png`;
const DEDUST_POOL_URL = 'https://dedust.io/pools/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB/deposit';
const TELEGRAM_BOT_URL = 'https://t.me/SolarisCET';
const PROCESSING_DURATION_MS = 2000;
const SUCCESS_DISPLAY_MS = 3000;


const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const titleCardRef = useRef<HTMLDivElement>(null);
  const hudCardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const statsTickerRef = useRef<HTMLDivElement>(null);
  const oracleSearchRef = useRef<HTMLDivElement>(null);

  const [miningState, setMiningState] = useState<MiningState>('IDLE');

  const handleMiningClick = useCallback(() => {
    if (miningState !== 'IDLE') return;

    setMiningState('PROCESSING');

    setTimeout(() => {
      setMiningState('SUCCESS');
      window.open(TELEGRAM_BOT_URL, '_blank');

      setTimeout(() => {
        setMiningState('IDLE');
      }, SUCCESS_DISPLAY_MS);
    }, PROCESSING_DURATION_MS);
  }, [miningState]);

  // Mouse parallax effect
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      gsap.to(coinRef.current, {
        x: dx * 18,
        y: dy * 10,
        rotateY: dx * 12,
        rotateX: -dy * 6,
        duration: 1.2,
        ease: 'power2.out',
      });

      gsap.to(titleCardRef.current, {
        x: dx * -8,
        y: dy * -5,
        duration: 1.4,
        ease: 'power2.out',
      });

      gsap.to(hudCardRef.current, {
        x: dx * 8,
        y: dy * -5,
        duration: 1.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to([coinRef.current, titleCardRef.current, hudCardRef.current], {
        x: 0,
        y: 0,
        rotateY: 0,
        rotateX: 0,
        duration: 1.2,
        ease: 'power2.out',
      });
    };

    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Load animation (auto-play on mount)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Coin entrance
      tl.fromTo(
        coinRef.current,
        { y: '6vh', rotateY: -25, scale: 0.92, opacity: 0 },
        { y: 0, rotateY: 0, scale: 1, opacity: 1, duration: 0.9 },
        0.15
      );

      // Title card entrance
      tl.fromTo(
        titleCardRef.current,
        { x: '-8vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8 },
        0.25
      );

      // HUD card entrance
      tl.fromTo(
        hudCardRef.current,
        { x: '8vw', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8 },
        0.35
      );

      // Headline words
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word');
        tl.fromTo(
          words,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.03, duration: 0.6 },
          0.45
        );
      }

      // Subheadline
      tl.fromTo(
        subheadlineRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.55
      );

      // Body text
      tl.fromTo(
        bodyRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.65
      );

      // CTA buttons
      tl.fromTo(
        ctaRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.75
      );

      // Oracle search bar
      tl.fromTo(
        oracleSearchRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 },
        0.82
      );

      // Stats ticker
      tl.fromTo(
        statsTickerRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        0.85
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Scroll-driven exit animation
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back
            gsap.set([coinRef.current, titleCardRef.current, hudCardRef.current, ctaRef.current, oracleSearchRef.current, statsTickerRef.current], {
              opacity: 1,
              x: 0,
              y: 0,
              rotateY: 0,
            });
          },
        },
      });

      // ENTRANCE (0% - 30%): Hold - elements already visible from load animation

      // SETTLE (30% - 70%): Hold

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        coinRef.current,
        { rotateY: 0, x: 0, opacity: 1 },
        { rotateY: 55, x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        titleCardRef.current,
        { x: 0, opacity: 1 },
        { x: '-12vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        hudCardRef.current,
        { x: 0, opacity: 1 },
        { x: '12vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        ctaRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(
        oracleSearchRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.76
      );

      scrollTl.fromTo(
        statsTickerRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.78
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-label="Solaris CET Hero"
      className="section-pinned min-h-screen bg-solaris-dark flex items-center justify-center"
      style={{ perspective: '1200px' }}
    >
      {/* Background grid floor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] grid-floor opacity-30" />
        <div className="absolute inset-0 tech-grid opacity-40" />
      </div>

      {/* Ambient glow orbs */}
      <GlowOrbs variant="mixed" />

      {/* Particle field background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleCanvas count={100} className="absolute inset-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.08)_0%,_transparent_50%)]" />
      </div>

      {/* 3D Coin - Center */}
      <div
        ref={coinRef}
        className="absolute left-1/2 top-[70%] sm:top-[52%] -translate-x-1/2 -translate-y-1/2 w-[min(70vw,520px)] sm:w-[min(42vw,520px)] z-10"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}hero-coin.png`}
          alt="Solaris CET Token Asset"
          width="512"
          height="512"
          className="w-full h-auto animate-coin-rotate drop-shadow-[0_0_80px_rgba(242,201,76,0.35)]"
        />
        {/* Coin reflection */}
        <div
          className="absolute inset-x-[15%] bottom-0 h-[30%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(242,201,76,0.12) 0%, transparent 70%)',
            transform: 'rotateX(180deg) scaleY(0.4) translateY(-100%)',
            opacity: 0.5,
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* Title Card - Left */}
      <div
        ref={titleCardRef}
        className="absolute left-[5vw] sm:left-[7vw] top-[12vh] sm:top-[20vh] w-[min(90vw,540px)] sm:w-[min(40vw,540px)] z-20"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="glass-card-gold p-5 lg:p-7 relative overflow-hidden holo-card">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-solaris-gold via-solaris-gold to-transparent" />
          
          {/* Circuit trace decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100,0 L60,0 L60,20 L40,20 L40,40 L20,40" stroke="#F2C94C" strokeWidth="1" fill="none" strokeDasharray="4,4" opacity="0.6" />
              <circle cx="60" cy="20" r="3" fill="#F2C94C" opacity="0.8" />
              <circle cx="40" cy="40" r="3" fill="#2EE7FF" opacity="0.8" />
            </svg>
          </div>

          {/* Logo + Title row */}
          <div
            ref={headlineRef}
            className="flex items-center gap-3 mb-2"
          >
            <img
              src={SOLARIS_LOGO_URL}
              alt="Solaris CET Logo"
              width="48"
              height="48"
              className="word shrink-0 w-12 h-12 rounded-xl object-contain"
            />
            <h1 className="font-display font-bold text-[clamp(24px,3.5vw,50px)] text-solaris-text leading-none">
              <span className="word inline-block text-gradient-animated">SOLARIS</span>
              <span className="word inline-block text-solaris-text/80 ml-2">(CET)</span>
            </h1>
          </div>

          <p
            ref={subheadlineRef}
            className="font-display font-semibold text-[clamp(12px,1.2vw,16px)] text-solaris-gold mb-3 flex items-center gap-2 flex-wrap"
          >
            <img src={`${import.meta.env.BASE_URL}bitcoin-logo.svg`} alt="Bitcoin" width="20" height="20" className="w-5 h-5 inline-block shrink-0" />
            Powered by Bitcoin · Bridge Between AI &amp; High Intelligence
          </p>
          
          <p
            ref={bodyRef}
            className="text-solaris-muted text-sm leading-relaxed"
          >
            100,000 TPS · 2-second finality on <span className="text-solaris-cyan font-medium">TON</span>. Powered by{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-solaris-gold font-medium cursor-help inline-flex items-center gap-0.5">
                  ReAct<HelpCircle className="w-3 h-3 opacity-60" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                Reasoning + Acting loop — the AI agent observes, thinks, and acts in iterative cycles to achieve goals autonomously.
              </TooltipContent>
            </Tooltip>
            ,{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-solaris-gold font-medium cursor-help inline-flex items-center gap-0.5">
                  BRAID<HelpCircle className="w-3 h-3 opacity-60" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                Branching Recursive AI Deliberation — a multi-path reasoning framework that lets agents explore and evaluate parallel decision trees.
              </TooltipContent>
            </Tooltip>
            {' '}&amp;{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-solaris-gold font-medium cursor-help inline-flex items-center gap-0.5">
                  Quantum OS<HelpCircle className="w-3 h-3 opacity-60" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-center">
                A probabilistic orchestration layer that schedules and coordinates AI agent tasks using quantum-inspired superposition principles.
              </TooltipContent>
            </Tooltip>
            {' '}protocols — the substrate for next-generation High-Intelligence AI agents.
          </p>

          {/* Status pill */}
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400">LIVE ON TON MAINNET</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons + AI Oracle Search — stacked column to prevent mobile overlap */}
      <div className="flex flex-col items-center w-full gap-y-12 px-4 py-8 z-20 sm:absolute sm:left-[7vw] sm:top-[68vh] sm:w-[min(40vw,540px)] sm:items-start sm:gap-3 sm:px-0 sm:py-0">
        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className="flex flex-wrap gap-3"
        >
          <button
            className={`btn-filled-gold flex items-center gap-2 group ${
              miningState === 'PROCESSING' ? 'cursor-wait opacity-80' : ''
            } ${miningState === 'SUCCESS' ? 'ring-2 ring-emerald-400/50' : ''}`}
            aria-label="Start Mobile Mining on Telegram"
            disabled={miningState === 'PROCESSING'}
            onClick={handleMiningClick}
          >
            {miningState === 'IDLE' && (
              <>
                <Zap className="w-4 h-4" />
                Start Mobile Mining
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
            {miningState === 'PROCESSING' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting to Node...
              </>
            )}
            {miningState === 'SUCCESS' && (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Mining Active
              </>
            )}
          </button>
          <button
            className="btn-gold"
            aria-label="Explore ReAct Protocol"
            onClick={() => document.getElementById('intelligence')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore ReAct Protocol
          </button>
          <button
            className="btn-gold flex items-center gap-2"
            aria-label="How to begin — step-by-step guide"
            onClick={() => document.getElementById('how-to-buy')?.scrollIntoView({ behavior: 'smooth' })}
          >
            How to Begin
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            className="btn-gold flex items-center gap-2"
            aria-label="Buy CET on DeDust exchange"
            onClick={() => window.open(DEDUST_POOL_URL, '_blank', 'noopener,noreferrer')}
          >
            Buy CET on DeDust
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI Oracle Search Bar */}
        <AiOracleSearch
          ref={oracleSearchRef}
          className="w-full"
        />
      </div>

      {/* HUD Card - Right (hidden on mobile) */}
      <div
        ref={hudCardRef}
        className="hidden sm:block absolute right-[7vw] top-[20vh] w-[min(28vw,380px)] z-20"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="glass-card p-5 lg:p-6 holo-card">
          <div className="scanline" />
          <div className="hud-label mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-solaris-gold" />
            Network Health
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-solaris-muted text-sm">TPS</span>
              <span className="font-mono text-solaris-gold text-lg font-semibold animate-text-flicker">~100,000</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex justify-between items-center">
              <span className="text-solaris-muted text-sm">Finality</span>
              <span className="font-mono text-solaris-cyan text-lg font-semibold">~2.0s</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex justify-between items-center">
              <span className="text-solaris-muted text-sm">Active Nodes</span>
              <span className="font-mono text-solaris-text text-lg font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                ~300
              </span>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-solaris-muted/50 text-right">
            * TON network estimates
          </p>

          {/* Mini chart */}
          <div className="mt-5 h-16 relative">
            <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F2C94C" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F2C94C" stopOpacity="0" />
                </linearGradient>
                <filter id="glow-chart">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M0,45 Q25,40 50,35 T100,25 T150,30 T200,15 L200,60 L0,60 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M0,45 Q25,40 50,35 T100,25 T150,30 T200,15"
                fill="none"
                stroke="#F2C94C"
                strokeWidth="2"
                filter="url(#glow-chart)"
                className="animate-pulse-glow"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Ticker - Bottom */}
      <div
        ref={statsTickerRef}
        className="absolute bottom-[5vh] left-0 right-0 z-20 overflow-hidden"
      >
        <div className="holo-line mb-3 mx-[5vw]" />
        <div className="flex items-center gap-0 whitespace-nowrap overflow-hidden">
          <div className="flex animate-ticker">
            {[
              { label: 'SUPPLY', value: '9,000 CET' },
              { label: 'NETWORK', value: 'TON' },
              { label: 'MAX TPS', value: '100,000' },
              { label: 'FINALITY', value: '2.0s' },
              { label: 'POOL', value: 'DeDust' },
              { label: 'MINING', value: '90 YEARS' },
              { label: 'SUPPLY', value: '9,000 CET' },
              { label: 'NETWORK', value: 'TON' },
              { label: 'MAX TPS', value: '100,000' },
              { label: 'FINALITY', value: '2.0s' },
              { label: 'POOL', value: 'DeDust' },
              { label: 'MINING', value: '90 YEARS' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 px-6">
                <span className="hud-label text-[10px]">{item.label}</span>
                <span className="font-mono text-xs text-solaris-gold font-semibold">{item.value}</span>
                <span className="text-solaris-muted/30 ml-2">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
