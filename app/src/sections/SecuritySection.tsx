import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Shield, CheckCircle, FileSearch, UserCheck, Code, Lock } from 'lucide-react';


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

      // Badge grid animation
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
      className="relative bg-solaris-dark py-24 lg:py-32"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto">
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
              Security <span className="text-emerald-400">First</span>
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
            {/* Security Score Banner */}
            <div className="glass-card-gold p-6 mb-10 flex flex-col sm:flex-row items-center gap-6">
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
                className="audit-badge glass-card p-5 hover:border-solaris-gold/30 transition-all duration-300 group"
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
      </div>
    </section>
  );
};

export default SecuritySection;
