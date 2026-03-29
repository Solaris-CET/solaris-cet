import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Brain, Lightbulb, Play, Eye, Zap } from 'lucide-react';
import AgentBridge from '../components/AgentBridge';
import GlowOrbs from '../components/GlowOrbs';
import { useReducedMotion } from '../hooks/useReducedMotion';


const steps = [
  { phase: 'THOUGHT', icon: '🧠', text: 'Analyzing blockchain data patterns...', color: '#F2C94C' },
  { phase: 'ACTION', icon: '⚡', text: 'Query DeDust pool liquidity metrics', color: '#2EE7FF' },
  { phase: 'OBSERVE', icon: '👁', text: 'Pool TVL: $2.4M | 24h Vol: $180K', color: '#34D399' },
  { phase: 'THOUGHT', icon: '🧠', text: 'High liquidity confirms token utility', color: '#F2C94C' },
  { phase: 'ACTION', icon: '⚡', text: 'Execute optimal swap route...', color: '#2EE7FF' },
  { phase: 'OBSERVE', icon: '👁', text: 'Swap completed. Slippage: 0.12%', color: '#34D399' },
];

const IntelligenceCoreSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [reactStep, setReactStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setReactStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    if (isMobile || prefersReducedMotion) {
      [leftCardRef.current, rightCardRef.current, chipsRef.current].forEach(el => {
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
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="intelligence"
      aria-label="Intelligence Core"
      className="section-pinned section-glass flex items-center justify-center section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="cyan" />

      {/* Left Info Card */}
      <div
        ref={leftCardRef}
        className="absolute left-[7vw] top-[26vh] w-[min(34vw,480px)] z-10"
      >
        <div className="bento-card p-6 lg:p-8 holo-card border border-solaris-gold/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-solaris-cyan/10 flex items-center justify-center animate-energy-pulse">
              <Brain className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">AI Integration</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            The Intelligence{' '}
            <span className="text-gradient-cyan">Core</span>
          </h2>

          <div className="space-y-4">
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              <span className="text-solaris-cyan font-semibold">ReAct Protocol</span> interleaves reasoning traces with actions—so agents explain before they execute.
            </p>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              Result: <span className="text-solaris-text font-medium">34% higher task success</span>, fewer hallucinations, and auditable on-chain logic.
            </p>
          </div>

          {/* Metrics row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-solaris-cyan">34%</div>
              <div className="hud-label text-[9px]">SUCCESS ↑</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-solaris-gold">74x</div>
              <div className="hud-label text-[9px]">EFFICIENCY</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-emerald-400">∞</div>
              <div className="hud-label text-[9px]">SCALE</div>
            </div>
          </div>

          {/* BRAID mention */}
          <div className="mt-4 p-4 rounded-xl bg-solaris-cyan/5 border border-solaris-cyan/20">
            <div className="hud-label text-solaris-cyan mb-2 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              BRAID Framework
            </div>
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
        <div className="bento-card h-full flex flex-col items-center justify-center relative overflow-hidden p-6">
          {/* Terminal-style ReAct demo */}
          <div className="w-full font-mono text-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-solaris-muted text-xs">ReAct Protocol · Live</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px]">ACTIVE</span>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="transition-all duration-500"
                  style={{
                    opacity: i <= reactStep ? (i === reactStep ? 1 : 0.35) : 0,
                    transform: i === reactStep ? 'translateX(0)' : 'translateX(-4px)',
                  }}
                >
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded mr-2"
                    style={{
                      color: step.color,
                      border: `1px solid ${step.color}`,
                      opacity: i === reactStep ? 1 : 0.7,
                      boxShadow: i === reactStep ? `0 0 8px ${step.color}40` : 'none',
                    }}
                  >
                    {step.phase}
                  </span>
                  <span className="mr-1">{step.icon}</span>
                  <span className="text-solaris-text text-xs">{step.text}</span>
                </div>
              ))}
            </div>

            {/* Cursor blink */}
            <div className="mt-4 flex items-center gap-1">
              <span className="text-solaris-cyan text-xs">▶</span>
              <div className="w-2 h-4 bg-solaris-cyan animate-pulse" />
            </div>
          </div>

          {/* ReAct label */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="holo-line mb-3" />
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
        <div className="hud-chip absolute right-[12vw] top-[18vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth">
          <Lightbulb className="w-4 h-4 text-solaris-gold" />
          <span className="font-mono text-sm text-solaris-text">Thought</span>
        </div>
        <div
          className="hud-chip absolute right-[6vw] top-[44vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth"
          style={{ animationDelay: '0.5s' }}
        >
          <Play className="w-4 h-4 text-solaris-cyan" />
          <span className="font-mono text-sm text-solaris-text">Action</span>
        </div>
        <div
          className="hud-chip absolute right-[14vw] top-[66vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth"
          style={{ animationDelay: '1s' }}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-sm text-solaris-text">Observation</span>
        </div>
      </div>

      {/* AgentBridge visualization */}
      <div className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 w-[min(80vw,800px)] z-10">
        <AgentBridge />
      </div>
    </section>
  );
};

export default IntelligenceCoreSection;
