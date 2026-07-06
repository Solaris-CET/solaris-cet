import {
  Anchor,
  BadgeCheck,
  CheckCircle,
  Code,
  FileSearch,
  Lock,
  Shield,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useMemo } from 'react';

import { ByzantineConsensusVisualization } from '@/components/ByzantineConsensusVisualization';
import MeshSkillRibbon from '@/components/MeshSkillRibbon';
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { useLanguage } from '@/hooks/useLanguage';
import {
  PUBLIC_CYBERSCOPE_URL,
  PUBLIC_FRESHCOINS_URL,
  PUBLIC_WHITEPAPER_IPFS_URL,
} from '@/lib/publicTrustLinks';

const AUDIT_BADGE_BASE = [
  { icon: FileSearch, color: 'gold', link: PUBLIC_CYBERSCOPE_URL, linkColor: 'text-solaris-gold' },
  { icon: CheckCircle, color: 'cyan', link: PUBLIC_FRESHCOINS_URL, linkColor: 'text-solaris-cyan' },
  { icon: UserCheck, color: 'emerald', link: PUBLIC_WHITEPAPER_IPFS_URL, linkColor: 'text-solaris-cyan' },
  { icon: Code, color: 'purple', link: 'https://github.com/Solaris-CET/solaris-cet', linkColor: 'text-purple-400' },
] as const;

const SecuritySection = () => {
  const { t } = useLanguage();
  const tx = t.securityUi;

  const auditBadges = useMemo(() => {
    return [
      {
        ...AUDIT_BADGE_BASE[0],
        label: tx.auditBadges.cyberscopeLabel,
        description: tx.auditBadges.cyberscopeDesc,
        linkLabel: tx.auditBadges.cyberscopeLinkLabel,
      },
      {
        ...AUDIT_BADGE_BASE[1],
        label: tx.auditBadges.freshcoinsLabel,
        description: tx.auditBadges.freshcoinsDesc,
        linkLabel: tx.auditBadges.freshcoinsLinkLabel,
      },
      {
        ...AUDIT_BADGE_BASE[2],
        label: tx.auditBadges.kycLabel,
        description: tx.auditBadges.kycDesc,
        linkLabel: tx.auditBadges.kycLinkLabel,
      },
      {
        ...AUDIT_BADGE_BASE[3],
        label: tx.auditBadges.openSourceLabel,
        description: tx.auditBadges.openSourceDesc,
        linkLabel: tx.auditBadges.openSourceLinkLabel,
      },
    ];
  }, [tx.auditBadges]);

  const securityFeatures = useMemo(() => {
    return [
      { icon: Lock, text: tx.securityFeatures.noAdminMinting },
      { icon: Shield, text: tx.securityFeatures.noHiddenProxies },
      { icon: Code, text: tx.securityFeatures.reproducibleCode },
    ];
  }, [tx.securityFeatures]);

  const trustSignals = useMemo(
    () =>
      [
        { icon: Sparkles, label: tx.trustBadges.aiAudited, ring: 'ring-solaris-gold/25', iconClass: 'text-solaris-gold' },
        { icon: BadgeCheck, label: tx.trustBadges.tonVerified, ring: 'ring-solaris-cyan/25', iconClass: 'text-solaris-cyan' },
        { icon: Anchor, label: tx.trustBadges.rwaAnchored, ring: 'ring-emerald-400/25', iconClass: 'text-emerald-400' },
      ] as const,
    [tx.trustBadges]
  );
  return (
    <section aria-label={t.sectionAria.security} className="relative section-glass section-padding-y overflow-hidden mesh-bg">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute inset-0 aurora-bg opacity-40" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <ScrollFadeUp>
            {/* Shield Icon */}
            <div
              className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center mb-6"
            >
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
              {tx.titleLead} <span className="text-gradient-aurora">{tx.titleHighlight}</span>
            </h2>

            <p className="text-solaris-muted text-base lg:text-lg leading-relaxed mb-6">
              <span className="text-solaris-gold font-semibold">{tx.proofCyberscope}</span>.{' '}
              <span className="text-solaris-cyan font-semibold">{tx.proofFreshcoins}</span>.{' '}
              <span className="text-emerald-400 font-semibold">{tx.proofKyc}</span>.
            </p>

            <p className="text-solaris-muted text-base leading-relaxed mb-8">
              {tx.transparencyBody}
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
          </ScrollFadeUp>

          {/* Right Column - Badge Grid */}
          <ScrollFadeUp>
            {/* Trust signals — audit & security */}
            <div
              className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
              role="group"
              aria-label={t.sectionAria.trustSignals}
            >
              <span className="text-solaris-muted text-[10px] font-mono uppercase tracking-[0.2em] shrink-0">
                {tx.trustSignalsLabel}
              </span>
              <ScrollStaggerFadeUp className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                {trustSignals.map(({ icon: Icon, label, ring, iconClass }) => (
                  <div
                    key={label}
                    className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-solaris-text shadow-depth ring-1 ${ring} transition-colors hover:border-white/20`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} aria-hidden />
                    <span>{label}</span>
                  </div>
                ))}
              </ScrollStaggerFadeUp>
            </div>

            <ByzantineConsensusVisualization />

            {/* Security Score Banner */}
            <div className="bento-card p-6 mb-10 flex flex-col md:flex-row items-center gap-6 border border-solaris-gold/30">
              <div className="shrink-0 text-center">
                <div className="font-display font-black text-6xl text-solaris-gold leading-none">A+</div>
                <div className="hud-label text-[10px] mt-1">{tx.ratingLabel}</div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: tx.scoreLabels.smartContract, score: 100 },
                  { label: tx.scoreLabels.kycVerification, score: 100 },
                  { label: tx.scoreLabels.auditCoverage, score: 100 },
                  { label: tx.scoreLabels.openSource, score: 100 },
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

            <ScrollStaggerFadeUp className="grid grid-cols-2 gap-4">
              {auditBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="bento-card p-5 hover:border-solaris-gold/30 transition-all duration-300 group"
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
                    className={`text-xs hover:opacity-90 transition-opacity mt-1 ${badge.linkColor} btn-quantum`}
                  >
                    {badge.linkLabel}
                  </a>
                )}
                </div>
              ))}
            </ScrollStaggerFadeUp>
          </ScrollFadeUp>
        </div>

        <div className="mt-12 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={1470} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
