import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import {
  Shield,
  CheckCircle,
  FileSearch,
  UserCheck,
  Code,
  Lock,
  Sparkles,
  BadgeCheck,
  Anchor,
} from 'lucide-react';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';


// Static data defined outside component to avoid re-creation on every render
const auditBadges = [
  {
    icon: FileSearch,
    label: 'Cyberscope Audited',
    description: 'Smart contract security audit completed',
    color: 'gold',
    link: 'https://www.cyberscope.io/',
    linkLabel: 'View Audit Report ↗',
    linkColor: 'text-solaris-gold',
  },
  {
    icon: CheckCircle,
    label: 'Freshcoins Verified',
    description: 'Project verification and due diligence',
    color: 'cyan',
  },
  {
    icon: UserCheck,
    label: 'KYC Completed',
    description: 'Team identity verification',
    color: 'emerald',
    link: 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a',
    linkLabel: 'See Whitepaper ↗',
    linkColor: 'text-solaris-cyan',
  },
  {
    icon: Code,
    label: 'Open Source',
    description: 'Fully transparent codebase',
    color: 'purple',
  },
];

const securityFeatures = [
  { icon: Lock, text: 'No admin minting' },
  { icon: Shield, text: 'No hidden proxies' },
  { icon: Code, text: 'Code is law—published and reproducible' },
];

/** Compact trust signals for audit & security — reduces perceived risk for new investors */
const trustSignalBadges = [
  { icon: Sparkles, label: 'AI Audited', ring: 'ring-solaris-gold/25', iconClass: 'text-solaris-gold' },
  { icon: BadgeCheck, label: 'TON Verified', ring: 'ring-solaris-cyan/25', iconClass: 'text-solaris-cyan' },
  { icon: Anchor, label: 'RWA Anchored', ring: 'ring-emerald-400/25', iconClass: 'text-emerald-400' },
] as const;

const SecuritySection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const badgeGridRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Left column animation
      gsap.fromTo(
        leftColumnRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: leftColumnRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Shield icon animation
      gsap.fromTo(
        shieldRef.current,
        { rotateZ: -6, scale: 0.9, opacity: 0 },
        {
          rotateZ: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: shieldRef.current,
            start: 'top 80%',
            end: 'top 60%',
            scrub: true,
          },
        }
      );

      // Trust signal pills + audit badge grid
      const trustSignals = badgeGridRef.current?.querySelectorAll('.trust-signal-badge');
      if (trustSignals) {
        gsap.fromTo(
          trustSignals,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.07,
            duration: 0.5,
            scrollTrigger: {
              trigger: badgeGridRef.current,
              start: 'top 80%',
              end: 'top 50%',
              scrub: true,
            },
          }
        );
      }
      const badges = badgeGridRef.current?.querySelectorAll('.audit-badge');
      if (badges) {
        gsap.fromTo(
          badges,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            scrollTrigger: {
              trigger: badgeGridRef.current,
              start: 'top 80%',
              end: 'top 50%',
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
      id="security"
      ref={sectionRef}
      aria-label="Security and Compliance"
      className="relative section-glass py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute inset-0 aurora-bg opacity-40" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div ref={leftColumnRef}>
            {/* Shield Icon */}
            <div
              ref={shieldRef}
              className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center mb-6"
            >
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
              Security <span className="text-gradient-aurora">First</span>
            </h2>

            <p className="text-solaris-muted text-base lg:text-lg leading-relaxed mb-6">
              <span className="text-solaris-gold font-semibold">Cyberscope audited</span>.{' '}
              <span className="text-solaris-cyan font-semibold">Freshcoins verified</span>.{' '}
              <span className="text-emerald-400 font-semibold">KYC completed</span>.
            </p>

            <p className="text-solaris-muted text-base leading-relaxed mb-8">
              Our commitment to transparency means no admin minting, no hidden proxies, and complete code reproducibility.
            </p>

            {/* Security features list */}
            <div className="space-y-3">
              {securityFeatures.map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                >
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                  <span className="text-solaris-text text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Badge Grid */}
          <div ref={badgeGridRef}>
            {/* Trust signals — audit & security */}
            <div
              className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
              role="group"
              aria-label="Trust signals"
            >
              <span className="text-solaris-muted text-[10px] font-mono uppercase tracking-[0.2em] shrink-0">
                Trust signals
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                {trustSignalBadges.map(({ icon: Icon, label, ring, iconClass }) => (
                  <div
                    key={label}
                    className={`trust-signal-badge inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-solaris-text shadow-depth ring-1 ${ring} transition-colors hover:border-white/20`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Score Banner */}
            <div className="bento-card p-6 mb-10 flex flex-col md:flex-row items-center gap-6 border border-solaris-gold/30">
              <div className="shrink-0 text-center">
                <div className="font-display font-black text-6xl text-solaris-gold leading-none">A+</div>
                <div className="hud-label text-[10px] mt-1">SECURITY RATING</div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: 'Smart Contract', score: 100 },
                  { label: 'KYC Verification', score: 100 },
                  { label: 'Audit Coverage', score: 100 },
                  { label: 'Open Source', score: 100 },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-solaris-muted">{label}</span>
                      <span className="font-mono text-solaris-gold">{score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-solaris-gold to-emerald-400 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
            {auditBadges.map((badge) => (
              <div
                key={badge.label}
                className="audit-badge bento-card p-5 hover:border-solaris-gold/30 transition-all duration-300 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    badge.color === 'gold'
                      ? 'bg-solaris-gold/10'
                      : badge.color === 'cyan'
                      ? 'bg-solaris-cyan/10'
                      : badge.color === 'emerald'
                      ? 'bg-emerald-400/10'
                      : 'bg-purple-400/10'
                  }`}
                >
                  <badge.icon
                    className={`w-5 h-5 ${
                      badge.color === 'gold'
                        ? 'text-solaris-gold'
                        : badge.color === 'cyan'
                        ? 'text-solaris-cyan'
                        : badge.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-purple-400'
                    }`}
                  />
                </div>
                <h3 className="font-display font-semibold text-solaris-text mb-1 group-hover:text-solaris-gold transition-colors">
                  {badge.label}
                </h3>
                <p className="text-solaris-muted text-xs leading-relaxed">
                  {badge.description}
                </p>
                {badge.link && (
                  <a
                    href={badge.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs hover:opacity-80 transition-opacity mt-1 ${badge.linkColor}`}
                  >
                    {badge.linkLabel}
                  </a>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={1470} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
