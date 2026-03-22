import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Crown, Code2, Palette, Brain, Shield, Globe } from 'lucide-react';
import GlowOrbs from '../components/GlowOrbs';

interface Department {
  id: string;
  name: string;
  tagline: string;
  agents: string[];
  icon: typeof Crown;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  badgeColor: string;
}

const departments: Department[] = [
  {
    id: 'csuite',
    name: 'C-Suite',
    tagline: '3 strategic agents driving vision, architecture and product',
    agents: ['CEO Agent', 'CTO Agent', 'CPO Agent'],
    icon: Crown,
    iconBg: 'bg-solaris-gold/10',
    iconColor: 'text-solaris-gold',
    borderColor: 'border-solaris-gold/30',
    badgeColor: 'bg-solaris-gold/10 text-solaris-gold border-solaris-gold/30',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    tagline: '5 engineering agents building and optimizing at machine speed',
    agents: ['VP Engineering', 'Senior Frontend ×2', 'Performance Engineer', 'QA Engineer'],
    icon: Code2,
    iconBg: 'bg-cyan-400/10',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-400/30',
    badgeColor: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
  },
  {
    id: 'design',
    name: 'Design',
    tagline: '3 design agents delivering pixel-perfect, accessible interfaces',
    agents: ['VP Design', 'UX Architect', 'UI Specialist'],
    icon: Palette,
    iconBg: 'bg-purple-400/10',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    badgeColor: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    tagline: '3 intelligence agents powering the ReAct protocol and on-chain reasoning',
    agents: ['AI Oracle Lead', 'ML Research', 'Data Pipeline'],
    icon: Brain,
    iconBg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-400/30',
    badgeColor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  {
    id: 'security',
    name: 'Security',
    tagline: '3 security agents operating 24/7 threat monitoring',
    agents: ['CISO', 'Smart Contract Auditor', 'Penetration Tester'],
    icon: Shield,
    iconBg: 'bg-red-400/10',
    iconColor: 'text-red-400',
    borderColor: 'border-red-400/30',
    badgeColor: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  {
    id: 'operations',
    name: 'Operations',
    tagline: '3 operations agents ensuring global reach and uptime',
    agents: ['DevOps', 'i18n Engineer', 'Community Manager'],
    icon: Globe,
    iconBg: 'bg-solaris-gold/10',
    iconColor: 'text-solaris-gold',
    borderColor: 'border-solaris-gold/30',
    badgeColor: 'bg-solaris-gold/10 text-solaris-gold border-solaris-gold/30',
  },
];

const AITeamSection = () => {
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

      const cards = cardsRef.current?.querySelectorAll('.team-card');
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
      id="team"
      ref={sectionRef}
      className="relative bg-solaris-dark py-24 lg:py-32 overflow-hidden"
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
        <div ref={headingRef} className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">AI CORPORATE STRUCTURE</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Powered by{' '}
            <span className="text-solaris-gold">AI Intelligence</span>
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            The world's first AI-native corporate structure — every role filled by a Solaris
            agent operating at the speed of thought.
          </p>
        </div>

        {/* Department cards */}
        <div
          ref={cardsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {departments.map((dept) => {
            const DeptIcon = dept.icon;
            const agentCount = dept.agents.length;

            return (
              <div
                key={dept.id}
                className={`team-card glass-card p-6 border ${dept.borderColor} flex flex-col gap-4 group hover:border-opacity-60 transition-all duration-300`}
              >
                {/* Icon + department name */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${dept.iconBg} flex items-center justify-center shrink-0`}>
                    <DeptIcon className={`w-5 h-5 ${dept.iconColor}`} />
                  </div>
                  <span className={`hud-label ${dept.iconColor}`}>{dept.name.toUpperCase()}</span>
                </div>

                {/* Agent list */}
                <ul className="space-y-1.5 flex-1">
                  {dept.agents.map((agent) => (
                    <li key={agent} className="flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full ${dept.iconColor} bg-current shrink-0`} />
                      <span className="text-solaris-text text-sm">{agent}</span>
                    </li>
                  ))}
                </ul>

                {/* Footer: headcount badge + tagline */}
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                  <span className={`self-start flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${dept.badgeColor}`}>
                    {agentCount} Agent{agentCount !== 1 ? 's' : ''}
                  </span>
                  <p className="text-solaris-muted text-xs leading-relaxed">{dept.tagline}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AITeamSection;
