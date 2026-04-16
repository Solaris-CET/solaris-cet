import { lazy, Suspense } from 'react';
import { Brain, TrendingUp, ChevronDown } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';
import AnimatedCounter from '../components/AnimatedCounter';
import AgentBoard from '../components/AgentBoard';
import LiveAgentStats from '../components/LiveAgentStats';
import { ChartLazyFallback } from '../components/ChartLazyFallback';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';

const AgentDepartmentChart = lazy(() => import('../components/AgentDepartmentChart'));
import { solarisDepartments } from '@/data/solarisDepartments';
import RoleSynthesizedSkills from '@/components/RoleSynthesizedSkills';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import {
  meshWhisperFromKey,
  meshStandardBurstForAiTeamRoleAgent,
  meshWhisperForAiTeamRoleGene,
} from '@/lib/meshSkillFeed';
import { useLanguage } from '../hooks/useLanguage';

const departments = solarisDepartments;

const TOTAL_AGENTS = departments.reduce((s, d) => s + d.agentCount, 0);

const AITeamSection = () => {
  const { t } = useLanguage();
  const tx = t.aiTeamUi;
  return (
    <section
      id="team"
      aria-label={t.sectionAria.aiTeamStructure}
      className="relative section-glass section-padding-y overflow-hidden mesh-bg"
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
        <ScrollFadeUp className="max-w-3xl mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">
              {tx.kicker}
            </span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.headlineLead} <span className="text-solaris-gold">{tx.headlineHighlight}</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.intro}
          </p>
        </ScrollFadeUp>

        <MeshSkillRibbon saltOffset={60} />

        {/* Grand-total stat bar */}
        <ScrollFadeUp>
          <div className="glass-card-gold p-6 mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="hud-label text-solaris-gold mb-1">{tx.totalWorkforceLabel}</div>
              <div className="font-display font-black text-4xl lg:text-5xl text-solaris-gold">
                <AnimatedCounter end={TOTAL_AGENTS} className="tabular-nums" meshTitleKey="aiTeam|counter|totalAgents" />
              </div>
              <div className="text-solaris-muted text-xs mt-1">{tx.totalWorkforceSub}</div>
            </div>
            <div>
              <div className="hud-label text-solaris-cyan mb-1">{tx.departmentsLabel}</div>
              <div className="font-display font-black text-4xl lg:text-5xl text-solaris-cyan">
                <AnimatedCounter end={10} className="tabular-nums" meshTitleKey="aiTeam|counter|departments" />
              </div>
              <div className="text-solaris-muted text-xs mt-1">{tx.departmentsSub}</div>
            </div>
            <div>
              <div className="hud-label text-emerald-400 mb-1">{tx.uptimeLabel}</div>
              <div className="font-display font-black text-4xl lg:text-5xl text-emerald-400">24/7</div>
              <div className="text-solaris-muted text-xs mt-1">{tx.uptimeSub}</div>
            </div>
          </div>
        </ScrollFadeUp>

        {/* Department matrix — 1 col narrow phones, 2 cols sm+, 5 cols lg+; Lucide + gold frame + hover scale */}
        <ScrollStaggerFadeUp className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  <span
                    id={titleId}
                    className={`hud-label text-[10px] leading-tight ${dept.iconColor}`}
                    title={meshWhisperFromKey(`aiTeam|dept|${dept.id}`)}
                  >
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
                      meshTitleKey={`aiTeam|counter|dept|${dept.id}`}
                    />
                  </div>
                  <div className="hud-label text-[10px] mt-0.5">{tx.agentsLabel}</div>
                </div>

                {/* Role + unique skill vectors (expandable) */}
                <ul className="space-y-2 flex-1 min-h-0">
                  {dept.roles.map((role) => (
                    <li key={role.title}>
                      <details className="group rounded-lg border border-white/[0.06] bg-black/20 open:border-white/12 open:bg-white/[0.03] transition-colors">
                        <summary
                          className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 px-3 select-none [&::-webkit-details-marker]:hidden min-h-[44px]"
                          title={meshStandardBurstForAiTeamRoleAgent(dept.id, role.title)}
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current ${dept.iconColor}`} />
                            <span className="text-xs font-semibold leading-tight text-solaris-text truncate">
                              {role.title}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-mono text-solaris-muted">
                            <span>
                              {role.skills.length}+
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180 opacity-70" aria-hidden />
                          </span>
                        </summary>
                        <div className="border-t border-white/[0.06] px-2 pb-2 pt-2 space-y-2">
                          <div className="text-[8px] font-mono uppercase tracking-wider text-solaris-muted/80">
                            {tx.curatedGenesLabel}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {role.skills.map((skill, geneIdx) => (
                              <span
                                key={skill}
                                className="max-w-full rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[8px] sm:text-[9px] leading-snug text-solaris-muted"
                                title={`${skill}\n—\n${meshWhisperForAiTeamRoleGene(dept.id, role.title, geneIdx)}`}
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
        </ScrollStaggerFadeUp>

        {/* Live Agent Activity Board */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-4 h-4 text-solaris-gold" />
            <span className="hud-label text-solaris-gold">
              {tx.liveActivityKicker}
            </span>
          </div>
          {/* Live cumulative stats */}
          <div className="mb-4">
            <LiveAgentStats />
          </div>
          <AgentBoard />
        </div>

        {/* Department distribution chart */}
        <div className="mt-6">
          <Suspense fallback={<ChartLazyFallback />}>
            <AgentDepartmentChart />
          </Suspense>
        </div>

        {/* Bottom comparison callout */}
        <div className="mt-10 bento-card p-6 border border-white/10 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-solaris-gold" />
          </div>
          <div>
            <div className="hud-label text-solaris-gold mb-1">{tx.competitiveParityKicker}</div>
            <p className="text-solaris-muted text-sm leading-relaxed">
              {tx.competitiveParityLead}
              <span className="text-solaris-text font-semibold">{tx.competitiveParityHighlight}</span>
              {tx.competitiveParityTail}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AITeamSection;
