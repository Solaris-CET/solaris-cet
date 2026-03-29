import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { CheckCircle, Loader, Circle } from 'lucide-react';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';

type PhaseStatus = 'done' | 'active' | 'upcoming';

interface Milestone {
  text: string;
}

interface Phase {
  id: string;
  quarter: string;
  title: string;
  status: PhaseStatus;
  milestones: Milestone[];
}

// Static data defined outside component to avoid re-creation on every render
const phases: Phase[] = [
  {
    id: 'q1',
    quarter: 'Q1 2025',
    title: 'Foundation',
    status: 'done',
    milestones: [
      { text: 'Token contract deployed on TON mainnet' },
      { text: 'Cyberscope smart contract audit completed' },
      { text: 'Freshcoins project verification' },
      { text: 'KYC process completed for core team' },
    ],
  },
  {
    id: 'q2',
    quarter: 'Q2 2025',
    title: 'Launch',
    status: 'done',
    milestones: [
      { text: 'DeDust DEX liquidity pool live' },
      { text: 'IPFS whitepaper publication' },
      { text: 'Landing page and community channels live' },
      { text: 'Initial token distribution completed' },
    ],
  },
  {
    id: 'q3',
    quarter: 'Q3 2025',
    title: 'Growth',
    status: 'done',
    milestones: [
      { text: 'AI-driven precision farming pilot in Puiești' },
      { text: 'Developer SDK and API beta release' },
      { text: 'ReAct Protocol on-chain reasoning traces' },
      { text: 'Governance voting module' },
    ],
  },
  {
    id: 'q4',
    quarter: 'Q4 2025',
    title: 'Scale',
    status: 'done',
    milestones: [
      { text: 'Next-gen processing units deployment' },
      { text: 'Self-Actualization Protocol mainnet' },
      { text: 'Cross-chain bridge exploration' },
      { text: 'Ecosystem grants program launch' },
    ],
  },
  {
    id: 'q1-2026',
    quarter: 'Q1 2026',
    title: 'Expand',
    status: 'done',
    milestones: [
      { text: 'Multi-chain liquidity integration completed' },
      { text: 'Community governance portal launched' },
      { text: 'AI oracle public API v1 released' },
      { text: 'Mobile wallet deep-link support deployed' },
    ],
  },
  {
    id: 'q2-2026',
    quarter: 'Q2 2026+',
    title: 'Evolve',
    status: 'active',
    milestones: [
      { text: 'Decentralized autonomous organization (DAO)' },
      { text: 'Cross-chain bridge mainnet launch' },
      { text: 'Ecosystem grants program expansion' },
      { text: 'Real-world asset (RWA) tokenisation pilot' },
    ],
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026+',
    title: 'Transcend',
    status: 'upcoming',
    milestones: [
      { text: 'AI-to-AI autonomous contract execution' },
      { text: 'Solaris Prime mainnet neural mesh' },
      { text: 'Zero-knowledge proof layer integration' },
      { text: 'Global agriculture data oracle network' },
    ],
  },
];

interface PhaseStatusConfig {
  icon: typeof CheckCircle;
  iconClass: string;
  iconAnimClass: string;
  borderClass: string;
  badgeClass: string;
  label: string;
}

const statusConfig: Record<PhaseStatus, PhaseStatusConfig> = {
  done: {
    icon: CheckCircle,
    iconClass: 'text-emerald-400',
    iconAnimClass: '',
    borderClass: 'border-emerald-400/30',
    badgeClass: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
    label: 'Completed',
  },
  active: {
    icon: Loader,
    iconClass: 'text-solaris-gold',
    iconAnimClass: 'animate-spin',
    borderClass: 'border-solaris-gold/40',
    badgeClass: 'bg-solaris-gold/10 text-solaris-gold border-solaris-gold/30',
    label: 'In Progress',
  },
  upcoming: {
    icon: Circle,
    iconClass: 'text-solaris-muted',
    iconAnimClass: '',
    borderClass: 'border-white/10',
    badgeClass: 'bg-white/5 text-solaris-muted border-white/10',
    label: 'Planned',
  },
};

const RoadmapSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
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

      const cards = cardsRef.current?.querySelectorAll('.roadmap-card');
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
              trigger: cardsRef.current,
              start: 'top 80%',
              end: 'top 35%',
              scrub: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="relative section-glass py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-emerald-400/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="hud-label text-emerald-400">ROADMAP</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            The Path to{' '}
            <span className="text-gradient-gold">Sustainable Growth</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            From the initial token launch to a full-scale AI-powered agricultural
            ecosystem — every milestone is publicly trackable and immutably recorded.
          </p>

          {/* Overall progress bar: 5 done + 1 active (0.5) of 7 = ~79% */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-solaris-muted text-[11px] uppercase tracking-wider">Overall Progress</span>
              <span className="font-mono text-solaris-gold text-xs font-bold">79%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-solaris-gold to-solaris-cyan"
                style={{ width: '79%', boxShadow: '0 0 12px rgba(242,201,76,0.4)' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-solaris-muted">
              <span>5 phases complete</span>
              <span>1 active · 1 upcoming</span>
            </div>
          </div>

          {/* Live progress indicator */}
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-solaris-gold/10 border border-solaris-gold/30">
            <span className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse inline-block" />
            <span className="font-mono text-solaris-gold text-xs font-semibold">
              NOW: Q2 2026 — DAO &amp; Cross-Chain Bridge in Progress
            </span>
          </div>
        </div>

        {/* Phase cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {phases.map((phase) => {
            const cfg = statusConfig[phase.status];
            const StatusIcon = cfg.icon;

            return (
              <div
                key={phase.id}
                className={`roadmap-card bento-card p-6 border ${cfg.borderClass} flex flex-col gap-4 group hover:border-opacity-60 transition-all duration-300`}
              >
                {/* Quarter + status badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-solaris-muted text-xs">{phase.quarter}</span>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}>
                    <StatusIcon className={`w-3 h-3 ${cfg.iconClass} ${cfg.iconAnimClass}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Phase title */}
                <h3 className="font-display font-bold text-solaris-text text-xl group-hover:text-solaris-gold transition-colors">
                  {phase.title}
                </h3>

                {/* Milestones */}
                <ul className="space-y-2 flex-1">
                  {phase.milestones.map((m) => (
                    <li key={m.text} className="flex items-start gap-2">
                      <StatusIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.iconClass} ${cfg.iconAnimClass}`} />
                      <span className="text-solaris-muted text-xs leading-relaxed">{m.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={910} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </div>
  );
};

export default RoadmapSection;
