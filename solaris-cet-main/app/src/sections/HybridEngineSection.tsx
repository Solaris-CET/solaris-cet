import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Zap, Cpu } from 'lucide-react';

const HybridEngineSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const coinRef = useRef<HTMLImageElement>(null);

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
  }, []);

  const badges = [
    { icon: Shield, label: 'PoW', color: 'text-solaris-gold' },
    { icon: Zap, label: 'DPoS', color: 'text-solaris-cyan' },
    { icon: Cpu, label: '100K TPS', color: 'text-emerald-400' },
  ];

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-solaris-dark flex items-center justify-center"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
      </div>

      {/* Background coin */}
      <img
        ref={coinRef}
        src="/hero-coin.png"
        alt=""
        className="absolute left-[60%] top-[45%] -translate-x-1/2 -translate-y-1/2 w-[min(35vw,400px)] opacity-0"
      />

      {/* Feature Card - Center */}
      <div
        ref={cardRef}
        className="relative z-10 w-[min(72vw,980px)]"
        style={{ perspective: '1000px' }}
      >
        <div className="glass-card p-8 lg:p-12 shimmer-border relative">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-solaris-gold" />
            </div>
            <h2
              ref={titleRef}
              className="font-display font-bold text-[clamp(24px,3vw,40px)] text-solaris-text"
            >
              <span className="word inline-block">The</span>{' '}
              <span className="word inline-block text-solaris-gold">Hybrid</span>{' '}
              <span className="word inline-block">Engine</span>
            </h2>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8">
            <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
              Dual-consensus: <span className="text-solaris-text font-medium">PoW for foundational security</span>,{' '}
              <span className="text-solaris-text font-medium">DPoS for ultra-fast execution</span>.
            </p>
            <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
              Dynamic block sizes on the Solaris Layer push throughput to{' '}
              <span className="text-solaris-gold font-semibold">100,000 TPS</span>—without sacrificing decentralization.
            </p>
          </div>

          {/* Badge row */}
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span className="font-mono text-sm text-solaris-text">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <div className="hud-label mb-1">Throughput</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-solaris-gold">
                100K <span className="text-lg text-solaris-muted">TPS</span>
              </div>
            </div>
            <div>
              <div className="hud-label mb-1">Finality</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-solaris-cyan">
                2.0 <span className="text-lg text-solaris-muted">sec</span>
              </div>
            </div>
            <div>
              <div className="hud-label mb-1">Energy Saved</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-emerald-400">
                99.95<span className="text-lg">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HybridEngineSection;
