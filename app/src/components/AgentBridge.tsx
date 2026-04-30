import { gsap } from 'gsap';
import { Brain, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';

import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { SolarisLogoMark } from '@/components/SolarisLogoMark';
import { shortSkillWhisper, skillSeedFromLabel } from '@/lib/meshSkillFeed';

/**
 * AgentBridge — animated signal bridge showing the data flow from
 * 200,000 AI agents → Solaris CET token → Real-world outcomes.
 * Uses bento-card styling with GSAP animated signal dots.
 */
const AgentBridge = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate the signal packets travelling left→right
      gsap.to('.bridge-dot', {
        x: '100%',
        duration: 2.4,
        stagger: { each: 0.4, repeat: -1 },
        ease: 'power1.inOut',
        opacity: 0,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const NODE_STYLE = 'bento-card p-5 text-center min-w-[130px] lg:min-w-[160px] flex flex-col items-center gap-2';

  return (
    <div ref={containerRef} data-testid="agent-bridge" className="relative w-full py-6 pointer-events-none">
      <div className="flex items-center justify-between gap-3 max-w-3xl mx-auto">

        {/* ── Left node: 200k Agents ── */}
        <div className={`${NODE_STYLE} border border-cyan-400/20`}>
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="hud-label text-cyan-400 text-[9px]">AGENTS</div>
          <div className="font-display font-bold text-sm text-gradient-cyan">200,000</div>
          <div className="text-solaris-muted text-[10px]">Autonomous AI</div>
          <p
            className="text-[8px] font-mono text-fuchsia-200/60 leading-tight line-clamp-2 mt-1 pt-1 border-t border-fuchsia-500/10"
            title={shortSkillWhisper(skillSeedFromLabel('agentBridge|agents'))}
          >
            {shortSkillWhisper(skillSeedFromLabel('agentBridge|agents'))}
          </p>
        </div>

        {/* ── Bridge left ── */}
        <div className="flex-1 relative h-10 overflow-hidden scroll-fade-x">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-cyan-400/60 via-solaris-gold/60 to-emerald-400/40" />
          </div>
          {[0, 25, 55].map((left, i) => (
            <div
              key={i}
              className="bridge-dot absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${left}%`,
                width: i === 0 ? 10 : 7,
                height: i === 0 ? 10 : 7,
                background: ['var(--solaris-cyan)', 'var(--solaris-gold)', 'rgb(16 185 129)'][i],
                opacity: 0.85,
                boxShadow: `0 0 8px ${['var(--solaris-cyan)', 'var(--solaris-gold)', 'rgb(16 185 129)'][i]}`,
              }}
            />
          ))}
        </div>

        {/* ── Center node: Solaris CET ── */}
        <div className={`${NODE_STYLE} border border-solaris-gold/40 neon-gold relative`}>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-solaris-gold text-solaris-dark text-[9px] font-mono font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            RAV BRIDGE
          </div>
          <div className="w-10 h-10 overflow-hidden rounded-xl bg-solaris-gold/10 flex items-center justify-center p-0">
            <SolarisLogoMark className="h-full w-full animate-logo-breathe motion-reduce:animate-none drop-shadow-[0_0_8px_rgba(242,201,76,0.4)]" />
          </div>
          <div className="hud-label text-solaris-gold text-[9px]">SOLARIS CET</div>
          <div className="font-display font-bold text-sm text-gradient-gold">9,000</div>
          <div className="text-solaris-muted text-[10px]">Fixed supply · TON</div>
          <p
            className="text-[8px] font-mono text-fuchsia-200/60 leading-tight line-clamp-2 mt-1 pt-1 border-t border-fuchsia-500/10"
            title={shortSkillWhisper(skillSeedFromLabel('agentBridge|rav'))}
          >
            {shortSkillWhisper(skillSeedFromLabel('agentBridge|rav'))}
          </p>
        </div>

        {/* ── Bridge right ── */}
        <div className="flex-1 relative h-10 overflow-hidden scroll-fade-x">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-emerald-400/40 via-solaris-gold/60 to-purple-400/60" />
          </div>
          {[0, 30, 60].map((left, i) => (
            <div
              key={i}
              className="bridge-dot absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${left}%`,
                width: i === 0 ? 10 : 7,
                height: i === 0 ? 10 : 7,
                background: ['rgb(16 185 129)', 'var(--solaris-gold)', 'rgb(167 139 250)'][i],
                opacity: 0.85,
                boxShadow: `0 0 8px ${['rgb(16 185 129)', 'var(--solaris-gold)', 'rgb(167 139 250)'][i]}`,
              }}
            />
          ))}
        </div>

        {/* ── Right node: High Intelligence ── */}
        <div className={`${NODE_STYLE} border border-purple-400/20`}>
          <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div className="hud-label text-purple-400 text-[9px]">OUTCOMES</div>
          <div className="font-display font-bold text-sm text-gradient-aurora">∞</div>
          <div className="text-solaris-muted text-[10px]">Real-world value</div>
          <p
            className="text-[8px] font-mono text-fuchsia-200/60 leading-tight line-clamp-2 mt-1 pt-1 border-t border-fuchsia-500/10"
            title={shortSkillWhisper(skillSeedFromLabel('agentBridge|outcomes'))}
          >
            {shortSkillWhisper(skillSeedFromLabel('agentBridge|outcomes'))}
          </p>
        </div>

      </div>

      <div className="max-w-3xl mx-auto mt-4 px-2">
        <MeshSkillRibbon variant="compact" saltOffset={2250} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
      </div>
    </div>
  );
};

export default AgentBridge;
