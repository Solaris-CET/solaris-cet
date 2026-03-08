import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Coins, Pickaxe, Users, TrendingDown } from 'lucide-react';

const TokenomicsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

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
        { scale: 0.78, y: '40vh', opacity: 0 },
        { scale: 1, y: 0, opacity: 1, ease: 'none' },
        0
      );

      const pills = pillsRef.current?.querySelectorAll('.metric-pill');
      if (pills) {
        scrollTl.fromTo(
          pills,
          { y: '10vh', opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.03, ease: 'none' },
          0.1
        );
      }

      // SETTLE (30% - 70%): Hold

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        cardRef.current,
        { scale: 1, y: 0, opacity: 1 },
        { scale: 0.92, y: '-30vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (pills) {
        scrollTl.fromTo(
          pills,
          { opacity: 1 },
          { opacity: 0, ease: 'power2.in' },
          0.75
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="staking"
      className="section-pinned bg-solaris-dark flex items-center justify-center"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
      </div>

      {/* Floating metric pills */}
      <div ref={pillsRef} className="absolute inset-0 pointer-events-none z-20">
        <div
          className="metric-pill absolute left-[6vw] top-[20vh] glass-card px-5 py-3 flex items-center gap-3 animate-float"
        >
          <Coins className="w-5 h-5 text-solaris-gold" />
          <div>
            <div className="hud-label text-[10px]">Max Supply</div>
            <div className="font-mono text-solaris-gold font-semibold">21M</div>
          </div>
        </div>
        <div
          className="metric-pill absolute right-[8vw] top-[24vh] glass-card px-5 py-3 flex items-center gap-3 animate-float"
          style={{ animationDelay: '0.5s' }}
        >
          <Pickaxe className="w-5 h-5 text-solaris-cyan" />
          <div>
            <div className="hud-label text-[10px]">Mining</div>
            <div className="font-mono text-solaris-cyan font-semibold">66.66%</div>
          </div>
        </div>
        <div
          className="metric-pill absolute right-[10vw] top-[64vh] glass-card px-5 py-3 flex items-center gap-3 animate-float"
          style={{ animationDelay: '1s' }}
        >
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="hud-label text-[10px]">Team</div>
            <div className="font-mono text-emerald-400 font-semibold">0.33%</div>
          </div>
        </div>
      </div>

      {/* Main Tokenomics Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-[min(78vw,1080px)]"
      >
        <div className="glass-card-gold p-8 lg:p-12 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Coins className="w-6 h-6 text-solaris-gold" />
            </div>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text">
              Tokenomics
            </h2>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Supply info */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">Fixed Supply</div>
                <div className="font-display font-bold text-3xl lg:text-4xl text-solaris-gold mb-1">
                  21,000,000
                </div>
                <div className="text-solaris-muted text-sm">BTC-S Total Supply</div>
              </div>

              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-2">Fair Launch Distribution</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-solaris-muted text-sm">Long-term Mining (90 years)</span>
                    <span className="font-mono text-solaris-cyan font-semibold">66.66%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-[66.66%] bg-gradient-to-r from-solaris-cyan to-solaris-gold rounded-full" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-solaris-muted text-sm">Team & Advisors</span>
                    <span className="font-mono text-emerald-400 font-semibold">0.33%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: DCBM */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-solaris-gold/5 border border-solaris-gold/20">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingDown className="w-5 h-5 text-solaris-gold" />
                  <div className="hud-label text-solaris-gold">DCBM Stability</div>
                </div>
                <p className="text-solaris-muted text-sm leading-relaxed mb-4">
                  <span className="text-solaris-text font-medium">Dynamic-Control Buyback Mechanism</span>{' '}
                  uses PID controllers to reduce volatility by{' '}
                  <span className="text-solaris-gold font-semibold">66%</span>.
                </p>
                <div className="flex items-center gap-2 text-xs text-solaris-muted">
                  <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
                  Scientific approach to price stability
                </div>
              </div>

              {/* Visual representation */}
              <div className="p-5 rounded-xl bg-white/5">
                <div className="hud-label mb-4">Supply Distribution</div>
                <div className="flex items-end gap-2 h-24">
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-solaris-cyan/80 rounded-t-lg" style={{ height: '80%' }} />
                    <span className="text-[10px] text-solaris-muted">Mining</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-solaris-gold/80 rounded-t-lg" style={{ height: '25%' }} />
                    <span className="text-[10px] text-solaris-muted">Ecosystem</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-emerald-400/80 rounded-t-lg" style={{ height: '8%' }} />
                    <span className="text-[10px] text-solaris-muted">Team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="hud-label mb-1">Launch Type</div>
              <div className="font-display font-semibold text-solaris-text">Fair Launch</div>
            </div>
            <div>
              <div className="hud-label mb-1">Mining Period</div>
              <div className="font-display font-semibold text-solaris-cyan">90 Years</div>
            </div>
            <div>
              <div className="hud-label mb-1">Volatility Reduction</div>
              <div className="font-display font-semibold text-solaris-gold">66%</div>
            </div>
            <div>
              <div className="hud-label mb-1">Target Valuation</div>
              <div className="font-display font-semibold text-emerald-400">€1B</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenomicsSection;
