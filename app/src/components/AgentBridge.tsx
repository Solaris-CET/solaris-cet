import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const AgentBridge = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.bridge-dot', {
        x: '100%',
        duration: 2,
        stagger: { each: 0.3, repeat: -1 },
        ease: 'power1.inOut',
        opacity: 0,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full py-8">
      <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
        {/* Left: AI Now */}
        <div className="glass-card p-4 text-center min-w-[140px]">
          <div className="text-2xl mb-2">🤖</div>
          <div className="hud-label text-solaris-muted text-[10px]">AI Agents</div>
          <div className="font-display font-semibold text-sm text-solaris-text">Today</div>
        </div>

        {/* Bridge left */}
        <div className="flex-1 relative h-12 overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-solaris-cyan via-solaris-gold to-emerald-400 opacity-50" />
          </div>
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-solaris-cyan opacity-80" style={{ left: '0%' }} />
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-solaris-gold opacity-80" style={{ left: '30%' }} />
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 opacity-80" style={{ left: '60%' }} />
        </div>

        {/* Center: Solaris CET */}
        <div className="glass-card-gold p-4 text-center min-w-[140px] relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-solaris-gold text-solaris-dark text-[10px] font-mono px-2 py-0.5 rounded-full">BRIDGE</div>
          <div className="text-2xl mb-2">🌞</div>
          <div className="hud-label text-solaris-gold text-[10px]">SOLARIS CET</div>
          <div className="font-display font-semibold text-sm text-solaris-gold">9,000 tokens</div>
        </div>

        {/* Bridge right */}
        <div className="flex-1 relative h-12 overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-emerald-400 via-solaris-gold to-solaris-cyan opacity-50" />
          </div>
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-400 opacity-80" style={{ left: '0%' }} />
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-solaris-gold opacity-80" style={{ left: '30%' }} />
          <div className="bridge-dot absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-solaris-cyan opacity-80" style={{ left: '60%' }} />
        </div>

        {/* Right: High Intelligence */}
        <div className="glass-card p-4 text-center min-w-[140px]">
          <div className="text-2xl mb-2">✨</div>
          <div className="hud-label text-solaris-muted text-[10px]">Super-Cognition</div>
          <div className="font-display font-semibold text-sm text-emerald-400">High Intelligence</div>
        </div>
      </div>
    </div>
  );
};

export default AgentBridge;
