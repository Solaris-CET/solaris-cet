import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Brain, TrendingUp, ChevronDown } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import AnimatedCounter from '../components/AnimatedCounter';
import AgentBoard from '../components/AgentBoard';
import LiveAgentStats from '../components/LiveAgentStats';
import AgentDepartmentChart from '../components/AgentDepartmentChart';
import { solarisDepartments } from '@/data/solarisDepartments';
import RoleSynthesizedSkills from '@/components/RoleSynthesizedSkills';

const departments = solarisDepartments;

const TOTAL_AGENTS = departments.reduce((s, d) => s + d.agentCount, 0);

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
      className="relative section-glass py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      <GlowOrbs variant="gold" />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-400/5 blur-[120px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">

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
        <div ref={statsRef} className="glass-card-gold p-6 mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
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

        {/* Department matrix — 1 col narrow phones, 2 cols sm+, 5 cols lg+; Lucide + gold frame + hover scale */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {departments.map((dept) => {
            const DeptIcon = dept.icon;

            const titleId = `dept-title-${dept.id}`;

            return (
              <article
                key={dept.id}
                className="team-card bento-card p-4 sm:p-5 flex flex-col gap-3 group transition-all duration-300"
                aria-labelledby={titleId}
              >
                {/* Icon + department name */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${dept.iconBg} flex items-center justify-center shrink-0`} aria-hidden>
                    <DeptIcon className={`w-4 h-4 ${dept.iconColor}`} />
                  </div>
                  <span id={titleId} className={`hud-label text-[10px] leading-tight ${dept.iconColor}`}>
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

                {/* Role + unique skill vectors (expandable) */}
                <ul className="space-y-2 flex-1 min-h-0">
                  {dept.roles.map((role) => (
                    <li key={role.title}>
                      <details className="group rounded-lg border border-white/[0.06] bg-black/20 open:border-white/12 open:bg-white/[0.03] transition-colors">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1.5 px-2 select-none [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className={`h-1 w-1 shrink-0 rounded-full bg-current ${dept.iconColor}`} />
                            <span className="text-xs font-medium leading-tight text-solaris-text truncate">
                              {role.title}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-[9px] font-mono text-solaris-muted">
                            <span>
                              {role.skills.length}+
                            </span>
                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180 opacity-70" aria-hidden />
                          </span>
                        </summary>
                        <div className="border-t border-white/[0.06] px-2 pb-2 pt-2 space-y-2">
                          <div className="text-[8px] font-mono uppercase tracking-wider text-solaris-muted/80">
                            Curated genes
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {role.skills.map((skill) => (
                              <span
                                key={skill}
                                className="max-w-full rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] sm:text-[9px] leading-snug text-solaris-muted"
                                title={skill}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <RoleSynthesizedSkills
                            deptId={dept.id}
                            roleTitle={role.title}
                            canonicalSkills={role.skills}
                          />
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </article>
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
        <div className="mt-10 bento-card p-6 border border-white/10 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
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
