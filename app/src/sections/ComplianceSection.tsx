import { gsap } from 'gsap';
import { FileCheck, Globe, Server,ShieldCheck } from 'lucide-react';
import { useLayoutEffect,useRef } from 'react';

import GlowOrbs from '../components/GlowOrbs';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useRegion } from '../hooks/useRegion';


const ComplianceSection = () => {
  const { t } = useLanguage();
  const tx = t.complianceUi;
  const { region } = useRegion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches;
    if (isMobile || prefersReducedMotion) {
      [leftCardRef.current, rightCardRef.current, badgesRef.current].forEach(el => {
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=70%',
          pin: true,
          scrub: 0.5,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(
        leftCardRef.current,
        { x: '-55vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        rightCardRef.current,
        { x: '55vw', rotateY: 35, opacity: 0 },
        { x: 0, rotateY: 0, opacity: 1, ease: 'none' },
        0
      );

      const badges = badgesRef.current?.querySelectorAll('.badge-chip');
      if (badges) {
        scrollTl.fromTo(
          badges,
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.03, ease: 'none' },
          0.12
        );
      }

      // SETTLE (30% - 70%): Hold

      scrollTl.to([leftCardRef.current, rightCardRef.current], { scale: 0.99, ease: 'none' }, 0.72);
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      aria-label={t.sectionAria.compliance}
      className="section-pinned section-glass flex flex-col items-start justify-start gap-10 py-16 xl:flex-row xl:items-center xl:justify-center xl:py-0 section-padding-x"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[50vh] grid-floor opacity-20" />
        <div className="absolute inset-0 tech-grid opacity-30" />
      </div>

      {/* Glow orbs */}
      <GlowOrbs variant="mixed" />

      {/* Left Compliance Card */}
      <div
        ref={leftCardRef}
        className="relative z-10 w-full max-w-[560px] mx-auto xl:mx-0 xl:absolute xl:left-[7vw] xl:top-[26vh] xl:w-[min(38vw,520px)]"
      >
        <div className="bento-card p-6 lg:p-8 holo-card border border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="hud-label text-emerald-400">Enterprise Ready</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(22px,2.5vw,36px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-emerald-400">{tx.titleAccent}</span>
          </h2>

          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-solaris-text text-sm">{tx.cardAuditTitle}</span>
              </div>
              <p className="text-solaris-muted text-sm leading-relaxed">
                {tx.cardAuditBody}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-solaris-cyan/5 border border-solaris-cyan/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-solaris-cyan" />
                <span className="font-semibold text-solaris-text text-sm">{tx.cardDataTitle}</span>
              </div>
              <p className="text-solaris-muted text-sm leading-relaxed">
                {tx.cardDataBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Hologram Card */}
      <div
        ref={rightCardRef}
        className="relative z-10 w-full max-w-[580px] mx-auto xl:mx-0 xl:absolute xl:right-[7vw] xl:top-[24vh] xl:w-[min(38vw,540px)] xl:h-[min(52vh,440px)]"
        style={{ perspective: '1000px' }}
      >
        <div className="bento-card flex flex-col items-center justify-center relative overflow-hidden xl:h-full">
          {/* Central icon */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-emerald-400/10 flex items-center justify-center mb-4">
              <Server className="w-12 h-12 text-emerald-400" />
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
              <div className="absolute -top-2 left-1/2 w-3 h-3 rounded-full bg-solaris-gold" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
              <div className="absolute -bottom-2 left-1/2 w-2 h-2 rounded-full bg-solaris-cyan" />
            </div>
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-solaris-muted text-sm">Audit Trail</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-emerald-400 text-sm">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-solaris-muted text-sm">Data Sovereignty</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-solaris-cyan animate-pulse" />
                <span className="font-mono text-solaris-cyan text-sm">Enabled</span>
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Badge Chips */}
      <div ref={badgesRef} className="hidden xl:block absolute inset-0 pointer-events-none z-20">
        <div className="badge-chip absolute right-[10vw] top-[16vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-sm text-solaris-text">Audit Ready</span>
        </div>
        <div
          className="badge-chip absolute right-[14vw] top-[70vh] bento-card px-4 py-2 flex items-center gap-2 animate-float shadow-depth"
          style={{ animationDelay: '0.5s' }}
        >
          <Globe className="w-4 h-4 text-solaris-cyan" />
          <span className="font-mono text-sm text-solaris-text">Sovereign AI</span>
        </div>
      </div>

      <p className="relative z-[25] w-full max-w-3xl mx-auto px-4 -mt-2 text-sm text-white/70 pointer-events-auto">
        {region === 'asia' ? t.region.disclaimerAsia : t.region.disclaimerEu}
      </p>

      <div className="relative z-[25] w-full max-w-3xl mx-auto pointer-events-auto xl:absolute xl:bottom-4 xl:left-4 xl:right-4">
        <MeshSkillRibbon variant="compact" saltOffset={1580} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
      </div>
    </section>
  );
};

export default ComplianceSection;
