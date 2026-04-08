import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Shield, Zap, Cpu, ArrowLeftRight } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import AppImage from '../components/AppImage';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useReducedMotion } from '../hooks/useReducedMotion';


const HybridEngineSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const coinRef = useRef<HTMLImageElement>(null);
  const svgPathRef = useRef<SVGPathElement>(null);
  const [activeNode, setActiveNode] = useState<'pow' | 'dpos' | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // SVG path animation
  useEffect(() => {
    const path = svgPathRef.current;
    if (!path) return;

    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });

    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      duration: 3,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true,
    });

    return () => { tween.kill(); };
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
    if (isMobile || prefersReducedMotion) {
      [cardRef.current, titleRef.current, coinRef.current].forEach(el => {
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        cardRef.current,
        { y: '60vh', rotateX: 18, scale: 0.86, opacity: 0 },
        { y: 0, rotateX: 0, scale: 1, opacity: 1, ease: 'none' },
        0
      );

      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll('.word');
        scrollTl.fromTo(
          words,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.02, ease: 'none' },
          0.05
        );
      }

      scrollTl.fromTo(
        coinRef.current,
        { x: '30vw', scale: 0.6, opacity: 0 },
        { x: 0, scale: 0.85, opacity: 0.35, ease: 'none' },
        0
      );

      // SETTLE (30% - 70%): Hold

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        cardRef.current,
        { y: 0, rotateX: 0, scale: 1, opacity: 1 },
        { y: '-40vh', rotateX: -12, scale: 0.92, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        coinRef.current,
        { x: 0, opacity: 0.35 },
        { x: '-20vw', opacity: 0.1, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const badges = [
    { icon: Shield, label: 'PoW Security', color: 'text-solaris-gold', bg: 'bg-solaris-gold/10', border: 'border-solaris-gold/30', key: 'pow' as const },
    { icon: Zap, label: 'DPoS Speed', color: 'text-solaris-cyan', bg: 'bg-solaris-cyan/10', border: 'border-solaris-cyan/30', key: 'dpos' as const },
    { icon: Cpu, label: 'Sharded L1', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', key: null },
  ];

  return (
    <section
      ref={sectionRef}
      className="section-pinned section-glass flex items-center justify-center section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="gold" />

      {/* Background coin */}
      <AppImage
        ref={coinRef}
        src={`${import.meta.env.BASE_URL}hero-coin.png`}
        alt="Solaris CET token coin"
        width="400"
        height="400"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="absolute left-[60%] top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(35vw,400px)] opacity-0 pointer-events-none"
      />

      {/* Feature Card - Center */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-[980px]"
        style={{ perspective: '1200px' }}
      >
        <div className="bento-card p-6 sm:p-8 lg:p-12 shimmer-border relative holo-card border border-solaris-gold/20 shadow-depth">
          {/* Circuit decoration top right */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-15 pointer-events-none overflow-hidden rounded-[18px]">
            <svg viewBox="0 0 128 128" className="w-full h-full">
              <path d="M128,0 L80,0 L80,30 L50,30 L50,60 L20,60 L20,90 L0,90" stroke="#2EE7FF" strokeWidth="1" fill="none" strokeDasharray="4,6" />
              <circle cx="80" cy="30" r="4" fill="#2EE7FF" />
              <circle cx="50" cy="60" r="4" fill="#F2C94C" />
              <circle cx="20" cy="90" r="4" fill="#2EE7FF" />
            </svg>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 flex items-center justify-center animate-gold-pulse">
              <Cpu className="w-6 h-6 text-solaris-gold" />
            </div>
            <h2
              ref={titleRef}
              className="font-display font-bold text-[clamp(24px,3vw,40px)] text-solaris-text"
            >
              <span className="word inline-block">The</span>{' '}
              <span className="word inline-block text-gradient-gold">Hybrid</span>{' '}
              <span className="word inline-block">Engine</span>
            </h2>
          </div>

          {/* Dual consensus diagram */}
          <div className="mb-8 relative">
            <div className="flex items-center justify-between gap-4">
              {/* PoW Node */}
              <button
                className={`flex-1 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  activeNode === 'pow'
                    ? 'bg-solaris-gold/10 border-solaris-gold shadow-gold'
                    : 'bg-white/5 border-white/10 hover:border-solaris-gold/40'
                }`}
                onClick={() => setActiveNode(activeNode === 'pow' ? null : 'pow')}
              >
                <Shield className="w-6 h-6 text-solaris-gold mx-auto mb-2" />
                <div className="font-mono text-sm text-solaris-gold font-semibold">PoW Layer</div>
                <div className="text-solaris-muted text-xs mt-1">Bitcoin-grade security</div>
                {activeNode === 'pow' && (
                  <div className="mt-3 pt-3 border-t border-solaris-gold/20 text-xs text-solaris-muted text-left">
                    SHA-256 proof-of-work provides immutable finality and censorship resistance on the base layer.
                  </div>
                )}
              </button>

              {/* Connector SVG */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <ArrowLeftRight className="w-5 h-5 text-solaris-muted" />
                <div className="w-1 h-8 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 4 32" preserveAspectRatio="none">
                    <path
                      ref={svgPathRef}
                      d="M2,0 L2,32"
                      stroke="url(#flowGrad)"
                      strokeWidth="2"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F2C94C" />
                        <stop offset="50%" stopColor="#2EE7FF" />
                        <stop offset="100%" stopColor="#F2C94C" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* DPoS Node */}
              <button
                className={`flex-1 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  activeNode === 'dpos'
                    ? 'bg-solaris-cyan/10 border-solaris-cyan shadow-cyan'
                    : 'bg-white/5 border-white/10 hover:border-solaris-cyan/40'
                }`}
                onClick={() => setActiveNode(activeNode === 'dpos' ? null : 'dpos')}
              >
                <Zap className="w-6 h-6 text-solaris-cyan mx-auto mb-2" />
                <div className="font-mono text-sm text-solaris-cyan font-semibold">DPoS Layer</div>
                <div className="text-solaris-muted text-xs mt-1">High-throughput execution (sharded)</div>
                {activeNode === 'dpos' && (
                  <div className="mt-3 pt-3 border-t border-solaris-cyan/20 text-xs text-solaris-muted text-left">
                    Delegated proof-of-stake enables fast finality and high throughput for parallel workloads.
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 mb-8">
            <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
              The execution layer is designed for high throughput via sharding and batching, while settlement remains verifiable on-chain.
            </p>
          </div>

          {/* Badge row */}
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${badge.bg} ${badge.border}`}
              >
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span className={`font-mono text-sm ${badge.color}`}>{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            <div className="stat-card p-3 rounded-lg bg-white/3">
              <div className="hud-label mb-1">Throughput</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-solaris-gold">
                High <span className="text-lg text-solaris-muted">sharded</span>
              </div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-white/3">
              <div className="hud-label mb-1">Finality</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-solaris-cyan">
                ~2 <span className="text-lg text-solaris-muted">sec</span>
              </div>
            </div>
            <div className="stat-card p-3 rounded-lg bg-white/3">
              <div className="hud-label mb-1">Energy Profile</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-emerald-400">
                PoS<span className="text-lg text-solaris-muted">-based</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-fuchsia-500/15">
            <MeshSkillRibbon variant="compact" saltOffset={740} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HybridEngineSection;
