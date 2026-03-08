import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Zap, Activity, Globe } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';
import GlowOrbs from '../components/GlowOrbs';


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
            gsap.set([coinRef.current, titleCardRef.current, hudCardRef.current, ctaRef.current, statsTickerRef.current], {
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
      ref={sectionRef}
      className="section-pinned bg-solaris-dark flex items-center justify-center"
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
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[min(42vw,520px)] z-10"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        <img
          src="/hero-coin.png"
          alt="Bitcoin Solaris Coin"
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
        className="absolute left-[7vw] top-[28vh] w-[min(38vw,520px)] z-20"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="glass-card-gold p-6 lg:p-8 relative overflow-hidden holo-card">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-solaris-gold via-solaris-gold to-transparent" />
          
          {/* Circuit trace decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100,0 L60,0 L60,20 L40,20 L40,40 L20,40" stroke="#F2C94C" strokeWidth="1" fill="none" strokeDasharray="4,4" opacity="0.6" />
              <circle cx="60" cy="20" r="3" fill="#F2C94C" opacity="0.8" />
              <circle cx="40" cy="40" r="3" fill="#2EE7FF" opacity="0.8" />
            </svg>
          </div>
          
          <h1
            ref={headlineRef}
            className="font-display font-bold text-[clamp(32px,4vw,56px)] text-solaris-text mb-2"
          >
            <span className="word inline-block">Bitcoin</span>{' '}
            <span className="word inline-block text-gradient-animated">Solaris</span>
          </h1>
          
          <p
            ref={subheadlineRef}
            className="font-display font-semibold text-[clamp(16px,1.5vw,24px)] text-solaris-gold mb-4"
          >
            The Substrate for High-Intelligence Models
          </p>
          
          <p
            ref={bodyRef}
            className="text-solaris-muted text-sm lg:text-base leading-relaxed"
          >
            A hybrid dual-layer blockchain delivering 100,000 TPS and 2-second finality—combining the security of Bitcoin with the speed of the agentic era.
          </p>

          {/* Status pill */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-400">LIVE ON TON MAINNET</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons - Left under title */}
      <div
        ref={ctaRef}
        className="absolute left-[7vw] top-[58vh] z-20 flex flex-wrap gap-4"
      >
        <button
          className="btn-filled-gold flex items-center gap-2 group"
          onClick={() => window.open('https://t.me/SolarisCET', '_blank')}
        >
          <Zap className="w-4 h-4" />
          Start Mobile Mining
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button
          className="btn-gold"
          onClick={() => document.getElementById('intelligence')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Explore ReAct Protocol
        </button>
        <button
          className="btn-gold flex items-center gap-2"
          onClick={() => window.open('https://dedust.io/swap/TON/EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB', '_blank')}
        >
          Buy CET on DeDust
        </button>
      </div>

      {/* HUD Card - Right */}
      <div
        ref={hudCardRef}
        className="absolute right-[7vw] top-[28vh] w-[min(28vw,380px)] z-20"
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
              <span className="font-mono text-solaris-gold text-lg font-semibold animate-text-flicker">102,341</span>
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
                18,420
              </span>
            </div>
          </div>

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
