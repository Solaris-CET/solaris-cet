import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import {
  Crown, Code2, Palette, Brain, Shield, Globe,
  Users, TrendingUp, Coins, FileCheck,
} from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import AnimatedCounter from '../components/AnimatedCounter';
import AgentBoard from '../components/AgentBoard';
import LiveAgentStats from '../components/LiveAgentStats';
import AgentDepartmentChart from '../components/AgentDepartmentChart';

// Total: 48 000 + 34 000 + 27 000 + 21 000 + 18 000 + 17 000 + 13 000 + 10 000 + 7 000 + 5 000 = 200 000
interface Department {
  id: string;
  name: string;
  agentCount: number;
  roles: string[];
  icon: typeof Crown;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  countColor: string;
}

const departments: Department[] = [
  {
    id: 'customer-ops',
    name: 'Customer Operations',
    agentCount: 48_000,
    roles: ['Tier-1 Support', 'Tier-2 Escalation', 'Account Success', 'Onboarding', 'Retention', 'Feedback Analysis'],
    icon: Users,
    iconBg: 'bg-cyan-400/10',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-400/20',
    countColor: 'text-cyan-400',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    agentCount: 34_000,
    roles: ['Frontend', 'Backend', 'Infrastructure', 'Mobile', 'QA & Testing', 'Performance', 'Platform'],
    icon: Code2,
    iconBg: 'bg-blue-400/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-400/20',
    countColor: 'text-blue-400',
  },
  {
    id: 'sales',
    name: 'Sales & Growth',
    agentCount: 27_000,
    roles: ['SDR', 'Account Executive', 'Partner Manager', 'Deal Intelligence', 'Pipeline Ops', 'Forecasting'],
    icon: TrendingUp,
    iconBg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-400/20',
    countColor: 'text-emerald-400',
  },
  {
    id: 'data-intelligence',
    name: 'Data & Intelligence',
    agentCount: 21_000,
    roles: ['ML Research', 'Data Pipeline', 'AI Oracle', 'Model Ops', 'BI Analyst', 'Synthetic Data'],
    icon: Brain,
    iconBg: 'bg-purple-400/10',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-400/20',
    countColor: 'text-purple-400',
  },
  {
    id: 'finance',
    name: 'Finance & Analytics',
    agentCount: 18_000,
    roles: ['FP&A', 'Treasury', 'Tax Compliance', 'Accounting', 'Risk Modelling', 'Payroll'],
    icon: Coins,
    iconBg: 'bg-solaris-gold/10',
    iconColor: 'text-solaris-gold',
    borderColor: 'border-solaris-gold/20',
    countColor: 'text-solaris-gold',
  },
  {
    id: 'marketing',
    name: 'Marketing & Content',
    agentCount: 17_000,
    roles: ['Copywriting', 'SEO', 'Social Media', 'Paid Ads', 'Email Campaigns', 'Brand Strategy'],
    icon: Globe,
    iconBg: 'bg-orange-400/10',
    iconColor: 'text-orange-400',
    borderColor: 'border-orange-400/20',
    countColor: 'text-orange-400',
  },
  {
    id: 'product-design',
    name: 'Product & Design',
    agentCount: 13_000,
    roles: ['Product Manager', 'UX Researcher', 'UI Designer', 'Prototyping', 'A/B Testing', 'Roadmap Planning'],
    icon: Palette,
    iconBg: 'bg-pink-400/10',
    iconColor: 'text-pink-400',
    borderColor: 'border-pink-400/20',
    countColor: 'text-pink-400',
  },
  {
    id: 'security',
    name: 'Security & Compliance',
    agentCount: 10_000,
    roles: ['SOC Analyst', 'Smart Contract Auditor', 'Pen Tester', 'GDPR/KYC', 'Threat Intel', 'Incident Response'],
    icon: Shield,
    iconBg: 'bg-red-400/10',
    iconColor: 'text-red-400',
    borderColor: 'border-red-400/20',
    countColor: 'text-red-400',
  },
  {
    id: 'legal',
    name: 'Legal & Risk',
    agentCount: 7_000,
    roles: ['Contract Review', 'IP Management', 'Regulatory Watch', 'Litigation Support', 'Policy Drafting'],
    icon: FileCheck,
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    countColor: 'text-amber-400',
  },
  {
    id: 'research',
    name: 'Research & Innovation',
    agentCount: 5_000,
    roles: ['Quantum Research', 'Advanced AI R&D', 'Blockchain Protocol', 'Agricultural Science', 'Patent Analysis'],
    icon: Crown,
    iconBg: 'bg-solaris-cyan/10',
    iconColor: 'text-solaris-cyan',
    borderColor: 'border-solaris-cyan/20',
    countColor: 'text-solaris-cyan',
  },
];

const TOTAL_AGENTS = 200_000;

const AITeamSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
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

      gsap.fromTo(
        statsRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 85%',
            end: 'top 60%',
            scrub: true,
          },
        }
      );

      const cards = cardsRef.current?.querySelectorAll('.team-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.7,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
              end: 'top 20%',
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
      id="team"
      ref={sectionRef}
      aria-label="AI Corporate Team Structure"
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="gold" />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-400/5 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">

        {/* Section heading */}
        <div ref={headingRef} className="max-w-3xl mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">AI CORPORATE STRUCTURE</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            200,000 Agents.{' '}
            <span className="text-solaris-gold">Zero Marginal Cost.</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            Large enterprises deploy hundreds of thousands of employees — now augmented by AI.
            Solaris CET matches that scale entirely through autonomous agents: 200,000 specialists
            operating 24/7, across 10 departments, at the speed of thought.
          </p>
        </div>

        {/* Grand-total stat bar */}
        <div ref={statsRef} className="glass-card-gold p-6 mb-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="hud-label text-solaris-gold mb-1">TOTAL WORKFORCE</div>
            <div className="font-display font-black text-4xl lg:text-5xl text-solaris-gold">
              <AnimatedCounter end={TOTAL_AGENTS} className="tabular-nums" />
            </div>
            <div className="text-solaris-muted text-xs mt-1">Autonomous Agents Deployed</div>
          </div>
          <div>
            <div className="hud-label text-solaris-cyan mb-1">DEPARTMENTS</div>
            <div className="font-display font-black text-4xl lg:text-5xl text-solaris-cyan">
              <AnimatedCounter end={10} className="tabular-nums" />
            </div>
            <div className="text-solaris-muted text-xs mt-1">Enterprise Divisions</div>
          </div>
          <div>
            <div className="hud-label text-emerald-400 mb-1">UPTIME</div>
            <div className="font-display font-black text-4xl lg:text-5xl text-emerald-400">
              24/7
            </div>
            <div className="text-solaris-muted text-xs mt-1">Always On — No Sleep, No Breaks</div>
          </div>
        </div>

        {/* Department cards — 5 columns on large screens, 2 on small */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {departments.map((dept) => {
            const DeptIcon = dept.icon;

            return (
              <div
                key={dept.id}
                className={`team-card bento-card p-5 border ${dept.borderColor} flex flex-col gap-3 group transition-all duration-300`}
              >
                {/* Icon + department name */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${dept.iconBg} flex items-center justify-center shrink-0`}>
                    <DeptIcon className={`w-4 h-4 ${dept.iconColor}`} />
                  </div>
                  <span className={`hud-label text-[10px] leading-tight ${dept.iconColor}`}>
                    {dept.name.toUpperCase()}
                  </span>
                </div>

                {/* Hero headcount */}
                <div>
                  <div className={`font-display font-black text-3xl ${dept.countColor} tabular-nums leading-none`}>
                    <AnimatedCounter
                      end={dept.agentCount}
                      suffix="+"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="hud-label text-[10px] mt-0.5">AGENTS</div>
                </div>

                {/* Role list */}
                <ul className="space-y-1 flex-1">
                  {dept.roles.map((role) => (
                    <li key={role} className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full bg-current shrink-0 ${dept.iconColor}`} />
                      <span className="text-solaris-muted text-xs leading-tight">{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Live Agent Activity Board */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-4 h-4 text-solaris-gold" />
            <span className="hud-label text-solaris-gold">AGENTS TALKING · LEARNING · SOLVING — RIGHT NOW</span>
          </div>
          {/* Live cumulative stats */}
          <div className="mb-4">
            <LiveAgentStats />
          </div>
          <AgentBoard />
        </div>

        {/* Department distribution chart */}
        <div className="mt-6">
          <AgentDepartmentChart />
        </div>

        {/* Bottom comparison callout */}
        <div className="mt-10 bento-card p-6 border border-white/10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-solaris-gold" />
          </div>
          <div>
            <div className="hud-label text-solaris-gold mb-1">COMPETITIVE PARITY</div>
            <p className="text-solaris-muted text-sm leading-relaxed">
              Fortune 500 companies deploy 100,000–300,000 employees — increasingly augmented by AI.
              Solaris CET matches that scale with <span className="text-solaris-text font-semibold">200,000 autonomous agents</span>:
              zero HR overhead, zero downtime, infinite parallelism.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITeamSection;
