import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Zap, Activity, Globe } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';


const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLImageElement>(null);
  const titleCardRef = useRef<HTMLDivElement>(null);
  const hudCardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

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
            gsap.set([coinRef.current, titleCardRef.current, hudCardRef.current, ctaRef.current], {
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
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-solaris-dark flex items-center justify-center"
    >
      {/* Background grid floor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] grid-floor opacity-30" />
      </div>

      {/* Particle field background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleCanvas count={80} className="absolute inset-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.08)_0%,_transparent_50%)]" />
      </div>

      {/* 3D Coin - Center */}
      <div
        ref={coinRef as React.RefObject<HTMLDivElement>}
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[min(42vw,520px)] z-10"
        style={{ perspective: '1000px' }}
      >
        <img
          src="/hero-coin.png"
          alt="Bitcoin Solaris Coin"
          className="w-full h-auto animate-coin-rotate drop-shadow-[0_0_60px_rgba(242,201,76,0.3)]"
        />
      </div>

      {/* Title Card - Left */}
      <div
        ref={titleCardRef}
        className="absolute left-[7vw] top-[28vh] w-[min(38vw,520px)] z-20"
      >
        <div className="glass-card-gold p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-solaris-gold via-solaris-gold to-transparent" />
          
          <h1
            ref={headlineRef}
            className="font-display font-bold text-[clamp(32px,4vw,56px)] text-solaris-text mb-2"
          >
            <span className="word inline-block">Bitcoin</span>{' '}
            <span className="word inline-block text-solaris-gold">Solaris</span>
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
      >
        <div className="glass-card p-5 lg:p-6">
          <div className="scanline" />
          <div className="hud-label mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-solaris-gold" />
            Network Health
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-solaris-muted text-sm">TPS</span>
              <span className="font-mono text-solaris-gold text-lg font-semibold">102,341</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between items-center">
              <span className="text-solaris-muted text-sm">Finality</span>
              <span className="font-mono text-solaris-cyan text-lg font-semibold">~2.0s</span>
            </div>
            <div className="h-px bg-white/10" />
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
                  <stop offset="0%" stopColor="#F2C94C" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F2C94C" stopOpacity="0" />
                </linearGradient>
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
                className="animate-pulse-glow"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
