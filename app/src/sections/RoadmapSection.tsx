import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, ChevronDown,Circle, Loader } from 'lucide-react';
import { useLayoutEffect, useMemo,useRef } from 'react';

import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { useLanguage } from '@/hooks/useLanguage';

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
const phasesEn: Phase[] = [
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

const phasesRo: Phase[] = [
  {
    id: 'q1',
    quarter: 'Q1 2025',
    title: 'Fundație',
    status: 'done',
    milestones: [
      { text: 'Contractul tokenului deployat pe TON mainnet' },
      { text: 'Audit Cyberscope finalizat pentru smart contract' },
      { text: 'Verificare proiect Freshcoins' },
      { text: 'Proces KYC finalizat pentru echipa core' },
    ],
  },
  {
    id: 'q2',
    quarter: 'Q2 2025',
    title: 'Lansare',
    status: 'done',
    milestones: [
      { text: 'Pool de lichiditate DeDust live' },
      { text: 'Publicare whitepaper pe IPFS' },
      { text: 'Landing page + canale comunitate live' },
      { text: 'Distribuție inițială token finalizată' },
    ],
  },
  {
    id: 'q3',
    quarter: 'Q3 2025',
    title: 'Creștere',
    status: 'done',
    milestones: [
      { text: 'Pilot agricultură de precizie (AI) în Puiești' },
      { text: 'SDK + API beta pentru dezvoltatori' },
      { text: 'Urme de raționament ReAct ancorate on-chain' },
      { text: 'Modul guvernanță (vot)' },
    ],
  },
  {
    id: 'q4',
    quarter: 'Q4 2025',
    title: 'Scalare',
    status: 'done',
    milestones: [
      { text: 'Deploy unități de procesare next-gen' },
      { text: 'Protocol de auto-actualizare pe mainnet' },
      { text: 'Explorare pod cross-chain' },
      { text: 'Program de granturi pentru ecosistem' },
    ],
  },
  {
    id: 'q1-2026',
    quarter: 'Q1 2026',
    title: 'Extindere',
    status: 'done',
    milestones: [
      { text: 'Integrare lichiditate multi-chain finalizată' },
      { text: 'Portal guvernanță comunitate lansat' },
      { text: 'Oracle AI · API public v1 lansat' },
      { text: 'Suport deep-link pentru portofel mobil' },
    ],
  },
  {
    id: 'q2-2026',
    quarter: 'Q2 2026+',
    title: 'Evoluție',
    status: 'active',
    milestones: [
      { text: 'Organizație autonomă descentralizată (DAO)' },
      { text: 'Pod cross-chain pe mainnet' },
      { text: 'Extindere program de granturi pentru ecosistem' },
      { text: 'Pilot tokenizare activ din lumea reală (RWA)' },
    ],
  },
  {
    id: 'q3-2026',
    quarter: 'Q3 2026+',
    title: 'Transcendență',
    status: 'upcoming',
    milestones: [
      { text: 'Execuție autonomă contracte AI-to-AI' },
      { text: 'Solaris Prime mainnet neural mesh' },
      { text: 'Integrare strat zero-knowledge proofs' },
      { text: 'Rețea globală de oracole pentru date agricole' },
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

gsap.registerPlugin(ScrollTrigger);

const RoadmapSection = () => {
  const { t, lang } = useLanguage();
  const tx = t.roadmapUi;
  const phases: Phase[] = useMemo(
    () => (({ ro: phasesRo } as Partial<Record<string, typeof phasesEn>>)[lang] ?? phasesEn),
    [lang],
  );
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const statusLabel: Record<PhaseStatus, string> = tx.status;

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
      if (cards?.length) {
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

      if (lineRef.current) {
        const path = lineRef.current;
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;

        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 85%',
            end: 'bottom 20%',
            scrub: true,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div
      id="roadmap"
      ref={sectionRef}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
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
            <span className="hud-label text-emerald-400">{tx.kicker}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-gradient-gold">{tx.titleHighlight}</span> {tx.titleTail}
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.subtitle}
          </p>

          {/* Overall progress bar: 5 done + 1 active (0.5) of 7 = ~79% */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-solaris-muted text-[11px] uppercase tracking-wider">
                {tx.overallProgressLabel}
              </span>
              <span className="font-mono text-solaris-gold text-xs font-bold">79%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-solaris-gold to-solaris-cyan"
                style={{ width: '79%', boxShadow: '0 0 12px rgba(242,201,76,0.4)' }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-solaris-muted">
              <span>{tx.phasesCompleteLabel}</span>
              <span>{tx.activeUpcomingLabel}</span>
            </div>
          </div>

          {/* Live progress indicator */}
          <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-solaris-gold/10 border border-solaris-gold/30">
            <span className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse inline-block" />
            <span className="font-mono text-solaris-gold text-xs font-semibold">
              {tx.nowLine}
            </span>
          </div>
        </div>

        <div
          ref={cardsRef}
          className="relative"
        >
          <div className="pointer-events-none absolute inset-y-0 left-4 lg:left-1/2 w-px bg-white/10" aria-hidden />
          <svg
            className="pointer-events-none absolute inset-y-0 left-4 lg:left-1/2 w-[2px]"
            width="2"
            height="100%"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              ref={lineRef}
              d="M1 0 V100"
              stroke="rgba(242,201,76,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          <div className="space-y-8 lg:space-y-10">
            {phases.map((phase, idx) => {
              const cfg = statusConfig[phase.status];
              const StatusIcon = cfg.icon;
              const isLeft = idx % 2 === 0;

              return (
                <div
                  key={phase.id}
                  className="roadmap-card relative pl-10 lg:pl-0 lg:grid lg:grid-cols-12 lg:gap-6"
                >
                  <div className="absolute left-4 top-6 -translate-x-1/2 lg:static lg:translate-x-0 lg:col-span-2 lg:col-start-6 flex justify-center">
                    <div
                      className={`relative grid place-items-center w-10 h-10 rounded-full border ${cfg.borderClass} bg-black/40 backdrop-blur`}
                    >
                      <div
                        className={`absolute inset-0 rounded-full ${phase.status === 'active' ? 'animate-pulse' : ''}`}
                        style={{
                          boxShadow:
                            phase.status === 'active'
                              ? '0 0 18px rgba(242,201,76,0.35)'
                              : phase.status === 'done'
                              ? '0 0 16px rgba(16,185,129,0.25)'
                              : 'none',
                        }}
                        aria-hidden
                      />
                      <StatusIcon className={`w-4 h-4 ${cfg.iconClass} ${cfg.iconAnimClass}`} />
                    </div>
                  </div>

                  <div
                    className={[
                      'lg:col-span-5',
                      isLeft ? 'lg:col-start-1' : 'lg:col-start-8',
                    ].join(' ')}
                  >
                    <details
                      className={`bento-card p-6 border ${cfg.borderClass} group transition-all duration-300 hover:border-opacity-60`}
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-solaris-muted text-xs">{phase.quarter}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}>
                              <StatusIcon className={`w-3 h-3 ${cfg.iconClass} ${cfg.iconAnimClass}`} />
                              {statusLabel[phase.status]}
                            </span>
                          </div>
                          <h3 className="mt-3 font-display font-bold text-solaris-text text-xl group-hover:text-solaris-gold transition-colors">
                            {phase.title}
                          </h3>
                        </div>
                        <ChevronDown className="h-5 w-5 shrink-0 text-solaris-muted transition-transform group-open:rotate-180" aria-hidden />
                      </summary>

                      <div className="mt-4 border-t border-white/10 pt-4">
                        <ul className="space-y-2">
                          {phase.milestones.map((m) => (
                            <li key={m.text} className="flex items-start gap-2">
                              <StatusIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.iconClass} ${cfg.iconAnimClass}`} />
                              <span className="text-solaris-muted text-xs leading-relaxed">{m.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={910} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </div>
  );
};

export default RoadmapSection;
