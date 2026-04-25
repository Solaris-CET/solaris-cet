import { useState } from 'react';
import { Download, FileText, ArrowRight, Globe, X, Send, Copy, CheckCircle, Zap, Shield, Users, CalendarClock } from "lucide-react";
import { SolarisLogoMark } from '../components/SolarisLogoMark';
import SocialShare from '../components/SocialShare';
import MeshSkillRibbon from '../components/MeshSkillRibbon';
import { useLanguage } from '../hooks/useLanguage';
import AnimatedCounter from '../components/AnimatedCounter';
import TeamFlipCard from '../components/TeamFlipCard';
import { useCommunityProof } from '../hooks/use-community-proof';
import { CET_CONTRACT_ADDRESS } from '@/lib/cetContract';
import { toast } from "sonner";
import { ScrollFadeUp } from '@/components/ScrollFadeUp';
import { HeaderTrustStrip } from '@/components/HeaderTrustStrip';
import {
  DEDUST_POOL_ADDRESS,
  DEDUST_POOL_DEPOSIT_URL,
  DEDUST_SWAP_URL,
} from '@/lib/dedustUrls';
import { PUBLIC_WHITEPAPER_IPFS_URL } from '@/lib/publicTrustLinks';

// Constants defined once to avoid duplication and maintain a single source of truth
const GITHUB_URL = 'https://github.com/Solaris-CET/solaris-cet';
const WHITEPAPER_URL = PUBLIC_WHITEPAPER_IPFS_URL;

const socialLinks = [
  { icon: X, href: 'https://twitter.com/SolarisCET', label: 'X', color: 'hover:text-solaris-cyan hover:bg-solaris-cyan/10' },
  { icon: Send, href: 'https://t.me/SolarisCET', label: 'Telegram', color: 'hover:text-solaris-cyan hover:bg-solaris-cyan/10' },
  { icon: Globe, href: GITHUB_URL, label: 'GitHub', color: 'hover:text-solaris-text hover:bg-white/10' },
  { icon: Globe, href: DEDUST_SWAP_URL, label: 'DeDust', color: 'hover:text-solaris-gold hover:bg-solaris-gold/10' },
];

const FooterSection = () => {
  const { t } = useLanguage();
  const tx = t.footerUi;
  const proof = useCommunityProof();
  /** Stable `key`s for React (not translated labels). Privacy + Terms share `href` so we cannot key by URL alone. */
  const footerLinks = [
    { id: 'privacy', label: t.footerNav.privacy, href: WHITEPAPER_URL, icon: undefined },
    { id: 'terms', label: t.footerNav.terms, href: WHITEPAPER_URL, icon: undefined },
    { id: 'accessibility', label: t.footerNav.accessibility, href: '/accessibility', icon: undefined },
    { id: 'contact', label: t.footerNav.contact, href: 'https://t.me/SolarisCET', icon: undefined },
    { id: 'authorityTrust', label: t.footerNav.authorityTrust, href: '#authority-trust', icon: undefined },
    /** Global comparison — primary discovery here + FAQ; not duplicated in header nav (5–7 target). */
    { id: 'competition', label: t.nav.competition, href: '#competition', icon: undefined },
    { id: 'sovereign', label: t.footerNav.sovereignNoJs, href: '/sovereign/', icon: Shield },
    { id: 'github', label: t.footerNav.github, href: GITHUB_URL, icon: Globe },
  ];
  const [copiedPool, setCopiedPool] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistBusy, setWaitlistBusy] = useState(false);

  const handleCopyPool = () => {
    navigator.clipboard.writeText(DEDUST_POOL_ADDRESS).then(() => {
      setCopiedPool(true);
      toast.success(t.social.linkCopied);
      setTimeout(() => setCopiedPool(false), 2000);
    }).catch(() => {/* clipboard access denied – fail silently */});
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CET_CONTRACT_ADDRESS).then(() => {
      setCopiedContract(true);
      toast.success(t.social.linkCopied);
      setTimeout(() => setCopiedContract(false), 2000);
    }).catch(() => {/* clipboard access denied – fail silently */});
  };

  const submitWaitlist = async () => {
    const email = waitlistEmail.trim();
    if (!email) return;
    setWaitlistBusy(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        cache: 'no-store',
      });
      if (res.ok) {
        toast.success(tx.waitlistAdded);
        setWaitlistEmail('');
        return;
      }
      const payload = (await res.json().catch(() => null)) as { error?: unknown } | null;
      const error = typeof payload?.error === 'string' ? payload.error : tx.waitlistUnavailable;
      if (res.status === 503) {
        window.location.href = `mailto:?subject=${encodeURIComponent(tx.mailtoSubject)}&body=${encodeURIComponent(
          tx.mailtoBody.replace('{email}', email),
        )}`;
        return;
      }
      toast.error(error);
    } catch {
      toast.error(tx.waitlistUnavailable);
    } finally {
      setWaitlistBusy(false);
    }
  };

  return (
    // Landmark `landmarks.footer` + `data-testid="footer-landmark-section"` live on App.tsx wrapper; avoid nested <section>.
    <div className="relative section-glass pt-16 pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] grid-floor opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-solaris-gold/20 to-transparent" />
      </div>

      <div className="relative z-10 section-padding-x max-w-6xl mx-auto w-full">
        {/* CTA Card */}
        <ScrollFadeUp>
          <div className="bento-card p-8 lg:p-12 mb-12 text-center relative overflow-hidden holo-card border border-solaris-gold/30 shadow-depth">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.06)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="hud-label text-solaris-gold mb-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
                {tx.kicker}
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
                {tx.headlineLead}
                <span className="text-gradient-gold">{tx.headlineAccent}</span>
                {tx.headlineTail}
              </h2>
              <p className="text-solaris-muted text-base lg:text-lg mb-8 max-w-lg mx-auto">
                {tx.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://t.me/+tKlfzx7IWopmNWQ0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-filled-gold flex items-center gap-2 group btn-quantum"
                >
                  <Download className="w-4 h-4" />
                  {tx.ctaTelegramMining}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href={WHITEPAPER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex items-center gap-2 btn-quantum"
                >
                  <FileText className="w-4 h-4" />
                  {tx.ctaWhitepaper}
                </a>
              </div>
            </div>
          </div>
        </ScrollFadeUp>

        {/* Founder Card */}
        <TeamFlipCard
          className="mb-6"
          initials="CB"
          role={tx.founderRole}
          name="Claudiu Ciprian Balaban"
          bio={tx.founderBio}
          linkedinUrl="https://www.linkedin.com/in/claudiu-ciprian-balaban-76ab8a394/"
        />

        {/* Contract address */}
        <div className="bento-card p-4 mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="hud-label text-[10px] mb-1">{tx.contractLabel}</div>
            <div className="font-mono text-xs text-solaris-muted truncate">{CET_CONTRACT_ADDRESS}</div>
          </div>
          <button
            onClick={handleCopyContract}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-solaris-gold/10 transition-all duration-200"
            aria-label={t.sectionAria.copyCetAddress}
            type="button"
          >
            {copiedContract
              ? <CheckCircle className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4 text-solaris-muted" />
            }
          </button>
        </div>

        {/* DeDust Pool address */}
        <div className="bento-card p-4 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="hud-label text-[10px] mb-1">
              <a
                href={DEDUST_POOL_DEPOSIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-solaris-gold transition-colors"
              >
                DeDust Pool — CET/USDT ↗
              </a>
            </div>
            <div className="font-mono text-xs text-solaris-muted truncate">{DEDUST_POOL_ADDRESS}</div>
          </div>
          <button
            onClick={handleCopyPool}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-solaris-gold/10 transition-all duration-200"
            aria-label={t.sectionAria.copyDedustPool}
            type="button"
          >
            {copiedPool
              ? <CheckCircle className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4 text-solaris-muted" />
            }
          </button>
        </div>

        {/* Newsletter */}
        <ScrollFadeUp>
        <div className="bento-card p-6 lg:p-8 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-solaris-cyan" />
                <span className="hud-label text-solaris-cyan">{tx.communityKicker}</span>
              </div>
              <p className="text-solaris-text">
                {tx.communityBody}
              </p>
              <p className="text-solaris-muted text-xs mt-1">
                {tx.communityMeta}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted">
                      <Send className="w-3.5 h-3.5 text-solaris-cyan" />
                      <span>{t.communityProof.telegramMembers}</span>
                    </div>
                    <Users className="w-4 h-4 text-solaris-gold/80" aria-hidden />
                  </div>
                  <AnimatedCounter
                    value={proof.telegramMembers}
                    prefix=""
                    suffix=""
                    duration={1.7}
                    className="text-2xl md:text-3xl"
                    wrapperClassName="items-start p-0 hover:bg-transparent"
                  />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-solaris-muted">
                      <X className="w-3.5 h-3.5 text-solaris-text" />
                      <span>{t.communityProof.xFollowers}</span>
                    </div>
                    <Users className="w-4 h-4 text-solaris-cyan/80" aria-hidden />
                  </div>
                  <AnimatedCounter
                    value={proof.xFollowers}
                    prefix=""
                    suffix=""
                    duration={1.7}
                    className="text-2xl md:text-3xl"
                    wrapperClassName="items-start p-0 hover:bg-transparent"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-solaris-muted">
                <CalendarClock className="w-3.5 h-3.5" aria-hidden />
                <span>
                  {t.communityProof.updatedPrefix} {proof.updatedAt}
                </span>
                {proof.stale ? <span className="text-amber-300/80">· {t.communityProof.staleHint}</span> : null}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 shrink-0">
              <a
                href="https://t.me/SolarisCET"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-solaris-cyan/10 border border-solaris-cyan/30 text-solaris-cyan font-semibold text-sm hover:bg-solaris-cyan/20 transition-all duration-200 active:scale-95 btn-quantum"
              >
                <Send className="w-4 h-4" />
                {tx.ctaTelegramChannel}
              </a>
              <a
                href="https://t.me/+tKlfzx7IWopmNWQ0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold font-semibold text-sm hover:bg-solaris-gold/20 transition-all duration-200 active:scale-95 btn-quantum"
              >
                <Zap className="w-4 h-4" />
                {tx.ctaMiningBot}
              </a>
            </div>
          </div>
        </div>
        </ScrollFadeUp>

        <ScrollFadeUp>
          <div className="bento-card p-6 lg:p-8 mb-10 border border-solaris-gold/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-solaris-gold" aria-hidden />
                  <span className="hud-label text-solaris-gold">{tx.emailWaitlistKicker}</span>
                </div>
                <p className="text-solaris-text">
                  {tx.emailWaitlistBody}
                </p>
                <p className="text-solaris-muted text-xs mt-1">
                  {tx.emailWaitlistFallback}
                </p>
              </div>
              <form
                className="flex flex-col sm:flex-row gap-3 shrink-0 w-full lg:w-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitWaitlist();
                }}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder={tx.emailPlaceholder}
                  className="min-h-11 w-full sm:w-[320px] rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-solaris-text placeholder:text-solaris-muted focus:outline-none focus:ring-2 focus:ring-solaris-gold/30"
                  aria-label={tx.emailAria}
                />
                <button
                  type="submit"
                  className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold px-5 text-sm font-semibold hover:bg-solaris-gold/20 transition-colors disabled:opacity-50 btn-quantum"
                  disabled={waitlistBusy}
                >
                  {waitlistBusy ? tx.emailSending : tx.emailNotify}
                  <Send className="w-4 h-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </ScrollFadeUp>

        {/* Footer */}
        <ScrollFadeUp>
        <footer className="pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3">
              <div
                className="relative w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_0_24px_rgba(242,201,76,0.12)] solaris-icon-glow motion-reduce:animate-none animate-logo-breathe p-0"
                aria-hidden
              >
                <SolarisLogoMark className="h-full w-full drop-shadow-[0_0_8px_rgba(242,201,76,0.35)]" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-lg text-solaris-text">
                  Solaris <span className="text-solaris-gold">CET</span>
                </span>
                <HeaderTrustStrip align="center" className="mt-1 max-w-none justify-start" />
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                data-testid={
                  link.href === '/sovereign/'
                    ? 'footer-sovereign-link'
                    : link.href === '#authority-trust'
                      ? 'footer-authority-trust-link'
                      : link.href === '#competition'
                        ? 'footer-competition-link'
                        : undefined
                }
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-sm text-solaris-muted hover:text-solaris-text transition-colors duration-300 flex items-center gap-1"
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-solaris-muted transition-all duration-300 ${social.color}`}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          <div className="my-6 holo-line" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <p className="text-solaris-muted text-sm">
                © {new Date().getFullYear()} Solaris CET. {tx.copyrightBridge} {tx.copyrightRights}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-solaris-muted/90">
                {t.footerMeta.genesisCertification}
              </p>
            </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
              <SocialShare />
              <div className="hidden md:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-solaris-gold font-semibold">₿</span>
                <span className="font-mono text-[11px] text-solaris-gold">POWERED BY BITCOIN</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400">{tx.liveOnTon}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 max-w-2xl mx-auto w-full">
            <MeshSkillRibbon
              variant="compact"
              saltOffset={880}
              className="border-fuchsia-500/12 bg-fuchsia-500/[0.03]"
            />
          </div>
          <p className="mt-6 text-center font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-solaris-gold/90 transition-all duration-700 cursor-default select-none">
            {tx.architectedBy}
          </p>
        </footer>
        </ScrollFadeUp>
      </div>
    </div>
  );
};

export default FooterSection;
