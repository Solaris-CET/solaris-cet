import { useMemo, useRef, useLayoutEffect, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Brain, Lightbulb, Play, Eye, Zap } from 'lucide-react';
import AgentBridge from '../components/AgentBridge';
import DualAiFusionGraphic from '../components/DualAiFusionGraphic';
import GlowOrbs from '../components/GlowOrbs';
import HierarchyGraph from '../components/HierarchyGraph';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useLanguage } from '../hooks/useLanguage';


type ReactStep = { phase: string; icon: string; text: string; color: string };

function parseReactStep(encoded: string): ReactStep {
  const [phase = '', icon = '', text = '', color = ''] = encoded.split('|');
  return { phase, icon, text, color: color || 'var(--solaris-cyan)' };
}

const IntelligenceCoreSection = () => {
  const { t } = useLanguage();
  const tx = t.intelligenceCoreUi;
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [reactStep, setReactStep] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const steps: ReactStep[] = useMemo(() => tx.reactSteps.map(parseReactStep), [tx.reactSteps]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setReactStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion, steps.length]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
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
          end: '+=70%',
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

      scrollTl.to([leftCardRef.current, rightCardRef.current], { scale: 0.99, ease: 'none' }, 0.72);
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="intelligence"
      aria-label={t.sectionAria.intelligenceCore}
      className="section-pinned section-glass flex flex-col items-start justify-start gap-10 py-16 xl:flex-row xl:items-center xl:justify-center xl:py-0 section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="cyan" />

      {/* Grok × Gemini → Solaris (RAV) — dual-AI fusion diagram */}
      <DualAiFusionGraphic />

      {/* Left Info Card */}
      <div
        ref={leftCardRef}
        className="relative z-10 w-full max-w-[520px] mx-auto xl:mx-0 xl:absolute xl:left-[7vw] xl:top-[26vh] xl:w-[min(34vw,480px)]"
      >
        <div className="bento-card p-6 lg:p-8 holo-card border border-solaris-gold/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-solaris-cyan/10 flex items-center justify-center animate-energy-pulse">
              <Brain className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">{tx.aiIntegrationLabel}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-gradient-cyan">{tx.titleAccent}</span> {tx.titleTail}
          </h2>

          <div className="space-y-4">
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              <span className="text-solaris-cyan font-semibold">ReAct Protocol</span>{' '}
              {tx.reactSentence}
            </p>
            <p className="text-solaris-muted text-sm lg:text-base leading-relaxed">
              {tx.resultSentence}
            </p>
          </div>

          {/* Metrics row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-solaris-cyan">{tx.metricTraceLabel}</div>
              <div className="hud-label text-[9px]">{tx.metricTraceSub}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-solaris-gold">{tx.metricVerifyLabel}</div>
              <div className="hud-label text-[9px]">{tx.metricVerifySub}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <div className="font-display font-bold text-lg text-emerald-400">∞</div>
              <div className="hud-label text-[9px]">{tx.metricIterationSub}</div>
            </div>
          </div>

          {/* BRAID mention */}
          <div className="mt-4 p-4 rounded-xl bg-solaris-cyan/5 border border-solaris-cyan/20">
            <div className="hud-label text-solaris-cyan mb-2 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              {tx.braidLabel}
            </div>
            <p className="text-solaris-muted text-sm">
              {tx.braidDesc}
            </p>
            <div className="mt-4">
              <HierarchyGraph />
            </div>
          </div>
        </div>
      </div>

      {/* Right Hologram Card */}
      <div
        ref={rightCardRef}
        className="relative z-10 w-full max-w-[560px] mx-auto xl:mx-0 xl:absolute xl:right-[7vw] xl:top-[24vh] xl:w-[min(36vw,520px)] xl:h-[min(50vh,420px)]"
        style={{ perspective: '1000px' }}
      >
        <div className="bento-card crt-terminal flex flex-col items-center justify-center relative overflow-hidden p-6 xl:h-full">
          {/* Terminal-style ReAct demo */}
          <div className="w-full font-mono text-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-solaris-muted text-xs">{tx.terminalTitle}</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px]">{tx.terminalActive}</span>
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
            <p
              className="mt-3 text-[10px] font-mono text-fuchsia-200/70 leading-snug line-clamp-2 border-t border-fuchsia-500/15 pt-2"
              title={shortSkillWhisper(skillSeedFromLabel(`intelcore|react|${reactStep}`))}
            >
              {shortSkillWhisper(skillSeedFromLabel(`intelcore|react|${reactStep}`))}
            </p>
          </div>

          {/* ReAct label */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="holo-line mb-3" />
            <div className="hud-label text-solaris-cyan mb-2">{tx.reasoningTraceLabel}</div>
            <div className="flex items-center gap-2 text-solaris-text text-sm">
              <div className="w-2 h-2 rounded-full bg-solaris-cyan animate-pulse" />
              {tx.decisionLoopsLabel}
            </div>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-solaris-cyan/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* HUD Chips */}
      <div ref={chipsRef} className="hidden xl:block absolute inset-0 pointer-events-none z-20">
        <div className="hud-chip absolute right-[12vw] top-[18vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth">
          <Lightbulb className="w-4 h-4 text-solaris-gold" />
          <span className="font-mono text-sm text-solaris-text">{tx.chipThought}</span>
        </div>
        <div
          className="hud-chip absolute right-[6vw] top-[44vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth"
          style={{ animationDelay: '0.5s' }}
        >
          <Play className="w-4 h-4 text-solaris-cyan" />
          <span className="font-mono text-sm text-solaris-text">{tx.chipAction}</span>
        </div>
        <div
          className="hud-chip absolute right-[14vw] top-[66vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth"
          style={{ animationDelay: '1s' }}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-sm text-solaris-text">{tx.chipObservation}</span>
        </div>
      </div>

      {/* AgentBridge visualization */}
      <div className="relative z-10 w-full max-w-[820px] mx-auto xl:absolute xl:bottom-[4vh] xl:left-1/2 xl:-translate-x-1/2 xl:w-[min(80vw,800px)] pointer-events-none">
        <AgentBridge />
      </div>
    </section>
  );
};

export default IntelligenceCoreSection;
