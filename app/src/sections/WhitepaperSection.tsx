import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import {
  Brain,
  Code2,
  RefreshCw,
  Coins,
  ShieldCheck,
  Download,
  Terminal,
  Cpu,
  Zap,
  GitBranch,
  Lock,
  FileText,
} from 'lucide-react';

const WHITEPAPER_URL =
  'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';

// Static data defined outside component to avoid re-creation on every render
const pillars = [
  {
    id: 'bridge',
    icon: Brain,
    color: 'gold',
    label: 'AI ↔ Human Bridge',
    title: 'High-Intelligence Bridge',
    body: 'Solaris CET acts as the connective tissue between on-chain intelligence and real-world decision-making. The protocol translates raw blockchain state into structured reasoning signals that both AI agents and human operators can act upon — closing the loop between data, insight, and execution.',
  },
  {
    id: 'platform',
    icon: Code2,
    color: 'cyan',
    label: 'Developer Platform',
    title: 'Personalized Dev Toolkit',
    body: 'A first-class SDK, REST/WebSocket API, and CLI give developers everything they need to integrate CET-powered intelligence into their own products. Type-safe clients, exhaustive docs, and a local sandbox mean you can go from idea to deployment in hours, not weeks.',
    chips: ['SDK', 'API', 'CLI'],
  },
  {
    id: 'react',
    icon: RefreshCw,
    color: 'purple',
    label: 'ReAct Protocol',
    title: 'Reason → Act Loop',
    body: 'Every agent action is preceded by an on-chain reasoning trace: observe → think → plan → execute → verify. This closed-loop architecture makes every decision auditable, reproducible, and improvable — the foundation of trustworthy autonomous systems.',
    steps: ['Observe', 'Think', 'Plan', 'Execute', 'Verify'],
  },
  {
    id: 'self',
    icon: Zap,
    color: 'emerald',
    label: 'Self-Actualization',
    title: 'Autonomous Improvement',
    body: 'Self-Actualization Protocols enable agents to auto-update their models, prune stale knowledge, and tighten feedback loops — all without human intervention. The network continuously optimizes itself, keeping intelligence fresh and aligned with evolving objectives.',
  },
  {
    id: 'utility',
    icon: Coins,
    color: 'gold',
    label: 'CET Utility',
    title: 'Token-Gated Intelligence',
    body: 'CET is the unit of value that unlocks premium compute, advanced model access, and governance weight. Developers stake CET to activate high-throughput API tiers; validators bond CET to participate in consensus; holders vote on protocol upgrades — aligning every stakeholder behind network quality.',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    color: 'cyan',
    label: 'Security & Durability',
    title: 'Immutable & Resilient',
    body: 'Built on TON with a fixed 9,000-token supply, no admin mint keys, and a Cyberscope-audited contract. Data permanence is guaranteed through IPFS content addressing. The architecture is designed to outlast any single organisation, operating as long as the TON network runs.',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  gold: {
    bg: 'bg-solaris-gold/10',
    text: 'text-solaris-gold',
    border: 'border-solaris-gold/30',
  },
  cyan: {
    bg: 'bg-solaris-cyan/10',
    text: 'text-solaris-cyan',
    border: 'border-solaris-cyan/30',
  },
  purple: {
    bg: 'bg-purple-400/10',
    text: 'text-purple-400',
    border: 'border-purple-400/30',
  },
  emerald: {
    bg: 'bg-emerald-400/10',
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
  },
};

const WhitepaperSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Heading entrance
      gsap.fromTo(
        headingRef.current,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 82%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Pillar cards staggered entrance
      const cards = gridRef.current?.querySelectorAll('.pillar-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.7,
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              end: 'top 35%',
              scrub: true,
            },
          }
        );
      }

      // CTA entrance
      gsap.fromTo(
        ctaRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 88%',
            end: 'top 65%',
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
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-solaris-cyan/5 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">WHITEPAPER</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            The Architecture of{' '}
            <span className="text-solaris-gold">Solaris CET</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            A hyper-scarce token on TON blockchain bridging human ambition and
            machine intelligence. Below is a structured overview of the core
            protocol pillars — from the AI bridge to developer tooling, the
            ReAct loop, self-actualization, token utility, and security.
          </p>
        </div>

        {/* Pillar grid */}
        <div
          ref={gridRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const c = colorMap[pillar.color];

            return (
              <div
                key={pillar.id}
                className={`pillar-card glass-card p-6 border ${c.border} hover:border-opacity-60 transition-all duration-300 group flex flex-col gap-4`}
              >
                {/* Icon + label */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <span className={`hud-label ${c.text}`}>{pillar.label}</span>
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold text-solaris-text text-lg group-hover:text-solaris-gold transition-colors leading-snug">
                  {pillar.title}
                </h3>

                {/* Body */}
                <p className="text-solaris-muted text-sm leading-relaxed flex-1">
                  {pillar.body}
                </p>

                {/* Optional chips (Developer Platform) */}
                {'chips' in pillar && pillar.chips && (
                  <div className="flex gap-2 flex-wrap">
                    {pillar.chips.map((chip) => (
                      <span
                        key={chip}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-solaris-cyan/10 border border-solaris-cyan/30 text-solaris-cyan text-xs font-mono"
                      >
                        <Terminal className="w-3 h-3" />
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional steps (ReAct Protocol) */}
                {'steps' in pillar && pillar.steps && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {pillar.steps.map((step, i) => (
                      <span key={step} className="flex items-center gap-1">
                        <span className="text-purple-400 text-xs font-mono">
                          {step}
                        </span>
                        {i < pillar.steps!.length - 1 && (
                          <GitBranch className="w-3 h-3 text-purple-400/50 rotate-90" />
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA — IPFS download + token stats */}
        <div
          ref={ctaRef}
          className="glass-card p-8 lg:p-10 border border-solaris-gold/20"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left — stats */}
            <div className="space-y-5">
              <h3 className="font-display font-bold text-[clamp(20px,2.5vw,30px)] text-solaris-text">
                On-chain facts,{' '}
                <span className="text-solaris-gold">immutably stored</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Coins, label: 'Total Supply', value: '9,000 CET', color: 'gold' },
                  { icon: Lock, label: 'Admin Mint Keys', value: 'None', color: 'emerald' },
                  { icon: Cpu, label: 'Blockchain', value: 'TON', color: 'cyan' },
                  { icon: ShieldCheck, label: 'Smart Contract', value: 'Audited', color: 'emerald' },
                ].map((stat) => {
                  const StatIcon = stat.icon;
                  const sc = colorMap[stat.color];
                  return (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl bg-white/5 flex flex-col gap-2"
                    >
                      <StatIcon className={`w-4 h-4 ${sc.text}`} />
                      <span className="text-solaris-muted text-xs">{stat.label}</span>
                      <span className={`font-mono font-semibold text-sm ${sc.text}`}>
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — download CTA */}
            <div className="flex flex-col gap-4 lg:items-end">
              <p className="text-solaris-muted text-sm lg:text-right leading-relaxed">
                The full whitepaper is permanently stored on IPFS — decentralized,
                censorship-resistant, and always available. Download the PDF for the
                complete technical specification.
              </p>

              <a
                href={WHITEPAPER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-solaris-gold text-solaris-dark font-semibold text-sm hover:bg-solaris-gold/90 active:scale-95 transition-all duration-200 group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Download Whitepaper (IPFS)
              </a>

              <span className="font-mono text-solaris-muted text-[10px] break-all lg:text-right">
                ipfs://bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhitepaperSection;
