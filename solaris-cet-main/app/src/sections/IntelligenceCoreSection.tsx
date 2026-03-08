import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Brain, Lightbulb, Play, Eye } from 'lucide-react';

const IntelligenceCoreSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

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
        leftCardRef.current,
        { x: '-55vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        rightCardRef.current,
        { x: '55vw', rotateY: -35, opacity: 0 },
        { x: 0, rotateY: 0, opacity: 1, ease: 'none' },
        0
      );

      const chips = chipsRef.current?.querySelectorAll('.hud-chip');
      if (chips) {
        scrollTl.fromTo(
          chips,
          { scale: 0.7, y: '4vh', opacity: 0 },
          { scale: 1, y: 0, opacity: 1, stagger: 0.03, ease: 'none' },
          0.1
        );
      }

      // SETTLE (30% - 70%): Hold

      // EXIT (70% - 100%)
      scrollTl.fromTo(
        leftCardRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        rightCardRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (chips) {
        scrollTl.fromTo(
          chips,
          { scale: 1, opacity: 1 },
          { scale: 0.9, opacity: 0, ease: 'power2.in' },
          0.75
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-pinned bg-solaris-dark flex items-center justify-center"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
      </div>

      {/* Left Info Card */}
      <div
        ref={leftCardRef}
        className="absolute left-[7vw] top-[26vh] w-[min(34vw,480px)] z-10"
      >
        <div className="glass-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-solaris-cyan/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">AI Integration</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            The Intelligence <span className="text-solaris-cyan">Core</span>
          </h2>

          <div className="space-y-4">
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              <span className="text-solaris-cyan font-semibold">ReAct Protocol</span> interleaves reasoning traces with actions—so agents explain before they execute.
            </p>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              Result: <span className="text-solaris-text font-medium">34% higher task success</span>, fewer hallucinations, and auditable on-chain logic.
            </p>
          </div>

          {/* BRAID mention */}
          <div className="mt-6 p-4 rounded-xl bg-solaris-cyan/5 border border-solaris-cyan/20">
            <div className="hud-label text-solaris-cyan mb-2">BRAID Framework</div>
            <p className="text-solaris-muted text-sm">
              Structural reasoning with Mermaid-based logic graphs for{' '}
              <span className="text-solaris-text font-semibold">74x efficiency gains</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Hologram Card */}
      <div
        ref={rightCardRef}
        className="absolute right-[7vw] top-[24vh] w-[min(36vw,520px)] h-[min(50vh,420px)] z-10"
        style={{ perspective: '1000px' }}
      >
        <div className="glass-card h-full flex flex-col items-center justify-center relative overflow-hidden">
          {/* Hologram cube */}
          <img
            src="/hologram-cube.png"
            alt=""
            className="w-[60%] h-auto animate-coin-rotate drop-shadow-[0_0_40px_rgba(46,231,255,0.3)]"
          />

          {/* ReAct label */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="hud-label text-solaris-cyan mb-2">REASONING TRACE</div>
            <div className="flex items-center gap-2 text-solaris-text text-sm">
              <div className="w-2 h-2 rounded-full bg-solaris-cyan animate-pulse" />
              Verifiable AI Decision Loops
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-solaris-cyan/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* HUD Chips */}
      <div ref={chipsRef} className="absolute inset-0 pointer-events-none z-20">
        <div className="hud-chip absolute right-[12vw] top-[18vh] glass-card px-4 py-2 flex items-center gap-2 animate-float">
          <Lightbulb className="w-4 h-4 text-solaris-gold" />
          <span className="font-mono text-sm text-solaris-text">Thought</span>
        </div>
        <div
          className="hud-chip absolute right-[6vw] top-[44vh] glass-card px-4 py-2 flex items-center gap-2 animate-float"
          style={{ animationDelay: '0.5s' }}
        >
          <Play className="w-4 h-4 text-solaris-cyan" />
          <span className="font-mono text-sm text-solaris-text">Action</span>
        </div>
        <div
          className="hud-chip absolute right-[14vw] top-[66vh] glass-card px-4 py-2 flex items-center gap-2 animate-float"
          style={{ animationDelay: '1s' }}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-sm text-solaris-text">Observation</span>
        </div>
      </div>
    </section>
  );
};

export default IntelligenceCoreSection;
