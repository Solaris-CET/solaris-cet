import { ArrowRightLeft, Check, Coins, Copy, ExternalLink,Wallet } from 'lucide-react';
import { useCallback,useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { ScrollStaggerFadeUp } from '@/components/ScrollStaggerFadeUp';
import { trackBuyClick } from '@/lib/analytics';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { mktEvent } from '@/lib/marketing';

import LivePoolStats from '../components/LivePoolStats';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';

const TONKEEPER_URL = 'https://tonkeeper.com';

type StepItem = {
  id: string;
  step: string;
  icon: typeof Wallet;
  color: 'gold' | 'cyan' | 'emerald';
  title: string;
  description: string;
  action: { label: string; href: string } | null;
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: 'bg-solaris-gold/10', text: 'text-solaris-gold', border: 'border-solaris-gold/30' },
  cyan: { bg: 'bg-solaris-cyan/10', text: 'text-solaris-cyan', border: 'border-solaris-cyan/30' },
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
};

const HowToBuySection = () => {
  const { t } = useLanguage();
  const tx = t.howToBuyUi;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const linkCopied = t.social.linkCopied;

  const steps: StepItem[] = useMemo(() => {
    return [
      {
        id: 'wallet',
        step: '01',
        icon: Wallet,
        color: 'cyan',
        title: tx.steps.walletTitle,
        description: tx.steps.walletDescription,
        action: {
          label: tx.steps.walletCta,
          href: TONKEEPER_URL,
        },
      },
      {
        id: 'fund',
        step: '02',
        icon: Coins,
        color: 'gold',
        title: tx.steps.fundTitle,
        description: tx.steps.fundDescription,
        action: null,
      },
      {
        id: 'swap',
        step: '03',
        icon: ArrowRightLeft,
        color: 'emerald',
        title: tx.steps.swapTitle,
        description: tx.steps.swapDescription,
        action: {
          label: tx.steps.swapCta,
          href: DEDUST_SWAP_URL,
        },
      },
    ];
  }, [tx.steps.fundDescription, tx.steps.fundTitle, tx.steps.swapCta, tx.steps.swapDescription, tx.steps.swapTitle, tx.steps.walletCta, tx.steps.walletDescription, tx.steps.walletTitle]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(CET_CONTRACT_ADDRESS).then(() => {
      setCopied(true);
      setCopyFailed(false);
      toast.success(linkCopied);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    });
  }, [linkCopied]);

  return (
    <section className="relative section-glass section-padding-y overflow-hidden mesh-bg">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-solaris-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <ScrollFadeUp className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">{tx.kicker}</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            {tx.titleLead} <span className="text-gradient-gold">{tx.titleToken}</span> {tx.titleTail}
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            {tx.subtitle}
          </p>
        </ScrollFadeUp>

        {/* Step cards */}
        <ScrollStaggerFadeUp className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {steps.map((step) => {
            const Icon = step.icon;
            const c = colorMap[step.color];
            return (
              <div
                key={step.id}
                className={`step-card bento-card p-6 border ${c.border} flex flex-col gap-4 group transition-all duration-300`}
              >
                {/* Step number */}
                <span className={`font-mono font-bold text-3xl ${c.text} opacity-40`}>
                  {step.step}
                </span>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${c.text}`} />
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold text-solaris-text text-lg group-hover:text-solaris-gold transition-colors">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-solaris-muted text-sm leading-relaxed flex-1">
                  {step.description}
                </p>

                {/* Optional action link */}
                {step.action && (
                  <a
                    href={step.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${c.text} hover:opacity-90 transition-opacity btn-quantum`}
                    onClick={() => {
                      if (step.action?.href === DEDUST_SWAP_URL) {
                        trackBuyClick({
                          destination: step.action.href,
                          source: `how_to_buy_step:${step.id}`,
                        });
                        mktEvent('buy_click', {
                          destination: step.action.href,
                          source: `how_to_buy_step:${step.id}`,
                        });
                      }
                    }}
                  >
                    {step.action.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </ScrollStaggerFadeUp>

        {/* Verified Safe trust bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[
            { label: tx.trustBadges.audit, color: 'text-solaris-gold border-solaris-gold/30 bg-solaris-gold/5' },
            { label: tx.trustBadges.kyc, color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
            { label: tx.trustBadges.freshcoins, color: 'text-solaris-cyan border-solaris-cyan/30 bg-solaris-cyan/5' },
            { label: tx.trustBadges.openSource, color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
          ].map(({ label, color }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}
            >
              <Check className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Contract address CTA */}
        <ScrollFadeUp>
          <div className="bento-card p-6 lg:p-8 border border-solaris-gold/20">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
              <div className="shrink-0">
                <span className="hud-label text-solaris-gold">
                  {tx.contractTitle}
                </span>
                <p className="text-solaris-muted text-xs mt-1">
                  {tx.contractSubtitle}
                </p>
              </div>

              <div className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <span className="font-mono text-solaris-text text-xs sm:text-sm truncate flex-1">
                  {CET_CONTRACT_ADDRESS}
                </span>
                <button
                  onClick={handleCopy}
                  aria-label={t.sectionAria.copyCetAddress}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold active:scale-95 transition-all duration-150 ${
                    copyFailed
                      ? 'bg-red-400/10 border-red-400/30 text-red-400 hover:bg-red-400/20'
                      : 'bg-solaris-gold/10 border-solaris-gold/30 text-solaris-gold hover:bg-solaris-gold/20'
                  }`}
                  type="button"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? tx.copyCopied : copyFailed ? tx.copyFailed : tx.copyIdle}
                </button>
              </div>

              <a
                href={DEDUST_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 btn-filled-gold text-sm btn-quantum"
                onClick={() => {
                  trackBuyClick({ destination: DEDUST_SWAP_URL, source: 'how_to_buy_cta' });
                  mktEvent('buy_click', { destination: DEDUST_SWAP_URL, source: 'how_to_buy_cta' });
                }}
              >
                <ArrowRightLeft className="w-4 h-4" />
                {tx.swapCta}
              </a>
            </div>
          </div>
        </ScrollFadeUp>

        {/* Live DeDust pool stats */}
        <div className="mt-6">
          <LivePoolStats />
        </div>

        <div className="mt-8 max-w-3xl">
          <MeshSkillRibbon variant="compact" saltOffset={1690} className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]" />
        </div>
      </div>
    </section>
  );
};

export default HowToBuySection;
