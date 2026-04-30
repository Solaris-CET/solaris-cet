import { Eye,Link2, MapPin, ShieldCheck } from 'lucide-react';

import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { renderSimpleBold } from '@/lib/renderSimpleBold';

import GlowOrbs from '../components/GlowOrbs';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Four trust pillars (Vibe Founder playbook): technical proof, on-chain truth,
 * geographic/legal anchor, operational transparency — B2B glass bento layout.
 */
const AuthorityTrustSection = () => {
  const { t } = useLanguage();

  const listedOn = [
    { label: 'Freshcoins', href: 'https://freshcoins.io' },
    { label: 'Tonviewer', href: 'https://tonviewer.com' },
    { label: 'TON', href: 'https://ton.org' },
  ] as const;

  const partners = [
    { label: 'DeDust', href: DEDUST_SWAP_URL },
    { label: 'IPFS', href: 'https://ipfs.tech' },
    { label: 'Cyberscope', href: 'https://cyberscope.io' },
  ] as const;

  const pillars = [
    {
      id: 'audit',
      icon: ShieldCheck,
      title: t.authorityTrust.pillar1Title,
      body: t.authorityTrust.pillar1Body,
      accent: 'from-amber-500/15 to-transparent',
    },
    {
      id: 'onchain',
      icon: Link2,
      title: t.authorityTrust.pillar2Title,
      body: t.authorityTrust.pillar2Body,
      accent: 'from-cyan-500/12 to-transparent',
    },
    {
      id: 'geo',
      icon: MapPin,
      title: t.authorityTrust.pillar3Title,
      body: t.authorityTrust.pillar3Body,
      accent: 'from-emerald-500/12 to-transparent',
    },
    {
      id: 'ops',
      icon: Eye,
      title: t.authorityTrust.pillar4Title,
      body: t.authorityTrust.pillar4Body,
      accent: 'from-violet-500/12 to-transparent',
    },
  ] as const;

  return (
    <section
      id="authority-trust"
      aria-label={t.sectionAria.authorityTrust}
      className="relative scroll-mt-24 py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(242,201,76,0.08), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(46,231,255,0.05), transparent 50%)',
          }}
        />
      </div>
      <GlowOrbs variant="gold" className="opacity-[0.35]" />

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-2xl">
            <p className="hud-label text-solaris-gold mb-3">{t.authorityTrust.kicker}</p>
            <h2 className="font-display font-bold text-[clamp(1.5rem,4vw,2.25rem)] leading-tight tracking-tight text-solaris-text text-balance">
              {t.authorityTrust.title}
            </h2>
            <p className="mt-4 text-solaris-muted text-sm sm:text-base leading-relaxed max-w-prose">
              {t.authorityTrust.subtitle}
            </p>
          </div>
        </div>

        <ScrollStaggerFadeUp className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.id}
                className="authority-pillar group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 sm:p-7 shadow-[0_8px_40px_rgba(0,0,0,0.25)] hover:border-solaris-gold/25 hover:bg-white/[0.05] hover:-translate-y-1.5 transition-all duration-[250ms]"
              >
                <div
                  className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${p.accent} opacity-80 group-hover:opacity-100 transition-opacity`}
                  aria-hidden
                />
                <div className="relative z-[1] flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-5 text-solaris-gold">
                    <Icon className="w-5 h-5" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="font-display font-semibold text-base sm:text-lg text-solaris-text mb-2 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-solaris-muted text-sm leading-relaxed flex-1">
                    {renderSimpleBold(p.body)}
                  </p>
                </div>
              </article>
            );
          })}
        </ScrollStaggerFadeUp>

        <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          <div className="bento-card p-5 border border-white/8 shadow-depth">
            <div className="hud-label mb-3">{t.authorityTrust.listedOnLabel}</div>
            <div className="hidden sm:flex flex-wrap gap-2">
              {listedOn.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-text text-xs font-semibold transition-all duration-300 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 hover:border-solaris-gold/30 btn-quantum"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-solaris-gold/80" />
                  {x.label}
                </a>
              ))}
            </div>
            <div className="sm:hidden overflow-hidden solaris-marquee">
              <div className="flex gap-2 solaris-marquee-track">
                {[...listedOn, ...listedOn].map((x, i) => (
                  <a
                    key={`${x.label}-${i}`}
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-text text-xs font-semibold grayscale opacity-70 btn-quantum"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-solaris-gold/80" />
                    {x.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="bento-card p-5 border border-white/8 shadow-depth">
            <div className="hud-label mb-3">{t.authorityTrust.partnersLabel}</div>
            <div className="hidden sm:flex flex-wrap gap-2">
              {partners.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-text text-xs font-semibold transition-all duration-300 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 hover:border-solaris-gold/30 btn-quantum"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-solaris-cyan/80" />
                  {x.label}
                </a>
              ))}
            </div>
            <div className="sm:hidden overflow-hidden solaris-marquee">
              <div className="flex gap-2 solaris-marquee-track">
                {[...partners, ...partners].map((x, i) => (
                  <a
                    key={`${x.label}-${i}`}
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-solaris-text text-xs font-semibold grayscale opacity-70 btn-quantum"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-solaris-cyan/80" />
                    {x.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthorityTrustSection;
