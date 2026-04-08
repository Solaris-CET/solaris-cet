import { useRef, useLayoutEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Wallet, ArrowRightLeft, Coins, Copy, Check, ExternalLink } from 'lucide-react';
import LivePoolStats from '../components/LivePoolStats';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { toast } from 'sonner';

const TONKEEPER_URL = 'https://tonkeeper.com';

// Static data defined outside component to avoid re-creation on every render
const steps = [
  {
    id: 'wallet',
    step: '01',
    icon: Wallet,
    color: 'cyan',
    title: 'Get a TON Wallet',
    description:
      'Download Tonkeeper (mobile or browser extension) and create a new wallet. Store your seed phrase securely — it is the only key to your funds.',
    action: {
      label: 'Get Tonkeeper',
      href: TONKEEPER_URL,
    },
  },
  {
    id: 'fund',
    step: '02',
    icon: Coins,
    color: 'gold',
    title: 'Fund with TON',
    description:
      'Purchase TON on any major exchange (Bybit, OKX, Huobi) and withdraw to your Tonkeeper address. You need TON to cover both the swap and the small network gas fee.',
    action: null,
  },
  {
    id: 'swap',
    step: '03',
    icon: ArrowRightLeft,
    color: 'emerald',
    title: 'Swap for CET on DeDust',
    description:
      'Go to DeDust and swap TON → CET. Always use the official contract address below to verify you are trading the authentic Solaris CET token.',
    action: {
      label: 'Open DeDust ↗',
      href: DEDUST_SWAP_URL,
    },
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: 'bg-solaris-gold/10', text: 'text-solaris-gold', border: 'border-solaris-gold/30' },
  cyan: { bg: 'bg-solaris-cyan/10', text: 'text-solaris-cyan', border: 'border-solaris-cyan/30' },
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
};

const HowToBuySection = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const linkCopied = t.social.linkCopied;

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

      const stepCards = stepsRef.current?.querySelectorAll('.step-card');
      if (stepCards) {
        gsap.fromTo(
          stepCards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.7,
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 80%',
              end: 'top 35%',
              scrub: true,
            },
          }
        );
      }

      gsap.fromTo(
        ctaRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 88%',
            end: 'top 65%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-to-buy"
      ref={sectionRef}
      className="relative section-glass py-24 lg:py-32 overflow-hidden mesh-bg"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] grid-floor opacity-15" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-solaris-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-solaris-gold/5 blur-[120px]" />
      </div>

      <div className="relative z-10 section-padding-x max-w-7xl mx-auto w-full">
        {/* Section heading */}
        <div ref={headingRef} className="max-w-2xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-solaris-gold/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-solaris-gold" />
            </div>
            <span className="hud-label text-solaris-gold">HOW TO BUY</span>
          </div>

          <h2 className="font-display font-bold text-[clamp(28px,3.5vw,48px)] text-solaris-text mb-4">
            Get <span className="text-gradient-gold">Solaris CET</span>{' '}
            in 3 Steps
          </h2>

          <p className="text-solaris-muted text-base lg:text-lg leading-relaxed">
            CET trades on the TON blockchain via DeDust DEX. Follow the steps
            below and always verify the contract address to stay safe from
            phishing tokens.
          </p>
        </div>

        {/* Step cards */}
        <div
          ref={stepsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
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
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${c.text} hover:opacity-80 transition-opacity`}
                  >
                    {step.action.label}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Verified Safe trust bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[
            { label: 'Cyberscope Audited', color: 'text-solaris-gold border-solaris-gold/30 bg-solaris-gold/5' },
            { label: 'KYC Verified',        color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
            { label: 'Freshcoins Listed',   color: 'text-solaris-cyan border-solaris-cyan/30 bg-solaris-cyan/5' },
            { label: 'Open Source',         color: 'text-purple-400 border-purple-400/30 bg-purple-400/5' },
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
        <div
          ref={ctaRef}
          className="bento-card p-6 lg:p-8 border border-solaris-gold/20"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            {/* Warning label */}
            <div className="shrink-0">
              <span className="hud-label text-solaris-gold">OFFICIAL CONTRACT ADDRESS</span>
              <p className="text-solaris-muted text-xs mt-1">
                Always verify before swapping — there is only one authentic CET token.
              </p>
            </div>

            {/* Address + copy */}
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
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied!' : copyFailed ? 'Failed' : 'Copy'}
              </button>
            </div>

            {/* DeDust swap button */}
            <a
              href={DEDUST_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 btn-filled-gold text-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Swap on DeDust
            </a>
          </div>
        </div>

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
