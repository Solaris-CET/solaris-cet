import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { CheckCircle, Loader, Circle } from 'lucide-react';

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
    status: 'active',
    milestones: [
      { text: 'AI-driven precision farming pilot in Puiești' },
      { text: 'Developer SDK and API beta release' },
      { text: 'ReAct Protocol on-chain reasoning traces' },
      { text: 'Governance voting module' },
    ],
  },
  {
    id: 'q4',
    quarter: 'Q4 2025+',
    title: 'Scale',
    status: 'upcoming',
    milestones: [
      { text: 'Next-gen processing units deployment' },
      { text: 'Self-Actualization Protocol mainnet' },
      { text: 'Cross-chain bridge exploration' },
      { text: 'Ecosystem grants program launch' },
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
    <section
      id="roadmap"
      ref={sectionRef}
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-emerald-400/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
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
            <span className="text-solaris-gold">Sustainable Growth</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            From the initial token launch to a full-scale AI-powered agricultural
            ecosystem — every milestone is publicly trackable and immutably recorded.
          </p>
        </div>

        {/* Phase cards */}
        <div
          ref={cardsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {phases.map((phase) => {
            const cfg = statusConfig[phase.status];
            const StatusIcon = cfg.icon;

            return (
              <div
                key={phase.id}
                className={`roadmap-card glass-card p-6 border ${cfg.borderClass} flex flex-col gap-4 group hover:border-opacity-60 transition-all duration-300`}
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
      </div>
    </section>
  );
};

export default RoadmapSection;
