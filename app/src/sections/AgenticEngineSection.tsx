import { lazy, Suspense, useRef, useLayoutEffect, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Cpu, Network } from 'lucide-react';
import GlowOrbs from '@/components/GlowOrbs';
import LiveNeuralFeed from '@/components/LiveNeuralFeed';
import DepartmentIntelligenceScores from '@/components/DepartmentIntelligenceScores';
import RavInternetMesh from '@/components/RavInternetMesh';
import { ChartLazyFallback } from '@/components/ChartLazyFallback';

const AgenticBenchmarkDashboard = lazy(() => import('@/components/AgenticBenchmarkDashboard'));
import AgenticNeuralCanvas from '@/components/AgenticNeuralCanvas';
import AgenticWhispers from '@/components/AgenticWhispers';
import AgenticSignalUnlock from '@/components/AgenticSignalUnlock';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Agentic engine narrative: live neural simulation, department IQ, RAV internet mesh, benchmark dashboard.
 * (Companion to AITeamSection — structural headcount lives there; this section is runtime / protocol intelligence.)
 */
const AgenticEngineSection = () => {
  const { t } = useLanguage();
  const tx = t.agenticEngineUi;
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setSectionVisible(!!e?.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          scrollTrigger: {
            trigger: headRef.current,
            start: 'top 85%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="agentic-engine"
      aria-label={t.sectionAria.agenticEngine}
      className="relative section-glass py-20 lg:py-28 overflow-hidden mesh-bg"
    >
      <AgenticSignalUnlock active={sectionVisible} />
      <GlowOrbs variant="cyan" />

      <div className="absolute inset-0 z-[5] min-h-[520px] pointer-events-none overflow-hidden">
        <AgenticNeuralCanvas />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[6]">
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-solaris-cyan/5 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-solaris-gold/5 blur-[90px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <div ref={headRef} className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-cyan/10 flex items-center justify-center">
              <Network className="w-5 h-5 text-solaris-cyan" />
            </div>
            <span className="hud-label text-solaris-cyan">
              {tx.kicker}
            </span>
          </div>
          <h2 className="font-display font-bold text-[clamp(26px,3.2vw,44px)] text-solaris-text mb-4">
            {tx.headlineBefore}{' '}
            <span className="relative inline-block text-solaris-gold drop-shadow-[0_0_12px_rgba(242,201,76,0.25)] after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-solaris-gold/70 after:to-transparent after:opacity-80">
              {tx.headlineHighlight}
            </span>{' '}
            {tx.headlineAfter}
          </h2>
          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.paragraph}
          </p>
        </div>

        <AgenticWhispers />

        <div className="mb-6 max-w-4xl">
          <MeshSkillRibbon variant="compact" saltOffset={480} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <LiveNeuralFeed />
          <RavInternetMesh />
        </div>

        <div className="mb-8 flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <Cpu className="w-5 h-5 text-solaris-gold shrink-0 mt-0.5" />
          <div>
            <div className="hud-label text-solaris-gold text-[10px] mb-1">{tx.trainingKicker}</div>
            <p className="text-solaris-muted text-xs sm:text-sm leading-relaxed">
              {tx.trainingBody}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <DepartmentIntelligenceScores />
          <Suspense fallback={<ChartLazyFallback />}>
            <AgenticBenchmarkDashboard />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default AgenticEngineSection;
