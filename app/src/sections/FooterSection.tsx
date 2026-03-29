import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Download, FileText, ArrowRight, Sun, Globe, X, Send, Copy, CheckCircle, Zap } from 'lucide-react';
import SocialShare from '../components/SocialShare';

// Constants defined once to avoid duplication and maintain a single source of truth
const GITHUB_URL = 'https://github.com/Solaris-CET/solaris-cet';
const DEDUST_POOL_ADDRESS = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
const DEDUST_POOL_DEPOSIT_URL = `https://dedust.io/pools/${DEDUST_POOL_ADDRESS}/deposit`;
const CET_CONTRACT_ADDRESS = 'EQBbUfeIo6yrNRButZGdf4WRJZZ3IDkN8kHJbsKlu3xxypWX';
const DEDUST_SWAP_URL = `https://dedust.io/swap/TON/${DEDUST_POOL_ADDRESS}`;
const WHITEPAPER_URL = 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';

// Static data defined outside component to avoid re-creation on every render
const footerLinks = [
  { label: 'Privacy', href: WHITEPAPER_URL, icon: undefined },
  { label: 'Terms', href: WHITEPAPER_URL, icon: undefined },
  { label: 'Contact', href: 'https://t.me/SolarisCET', icon: undefined },
  { label: 'GitHub', href: GITHUB_URL, icon: Globe },
];

const socialLinks = [
  { icon: X, href: 'https://twitter.com/SolarisCET', label: 'X', color: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10' },
  { icon: Send, href: 'https://t.me/SolarisCET', label: 'Telegram', color: 'hover:text-[#2AABEE] hover:bg-[#2AABEE]/10' },
  { icon: Globe, href: GITHUB_URL, label: 'GitHub', color: 'hover:text-solaris-text hover:bg-white/10' },
  { icon: Globe, href: DEDUST_SWAP_URL, label: 'DeDust', color: 'hover:text-solaris-gold hover:bg-solaris-gold/10' },
];

const FooterSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [copiedPool, setCopiedPool] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const handleCopyPool = () => {
    navigator.clipboard.writeText(DEDUST_POOL_ADDRESS).then(() => {
      setCopiedPool(true);
      setTimeout(() => setCopiedPool(false), 2000);
    }).catch(() => {/* clipboard access denied – fail silently */});
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(CET_CONTRACT_ADDRESS).then(() => {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }).catch(() => {/* clipboard access denied – fail silently */});
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ctaCardRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8,
          scrollTrigger: { trigger: ctaCardRef.current, start: 'top 85%', end: 'top 60%', scrub: true },
        }
      );
      gsap.fromTo(
        newsletterRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8,
          scrollTrigger: { trigger: newsletterRef.current, start: 'top 85%', end: 'top 65%', scrub: true },
        }
      );
      gsap.fromTo(
        footerRef.current,
        { opacity: 0 },
        {
          opacity: 1, duration: 0.6,
          scrollTrigger: { trigger: footerRef.current, start: 'top 90%', end: 'top 75%', scrub: true },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative section-glass pt-16 pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] grid-floor opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-solaris-gold/20 to-transparent" />
      </div>

      <div className="relative z-10 section-padding-x max-w-6xl mx-auto w-full">
        {/* CTA Card */}
        <div ref={ctaCardRef} className="bento-card p-8 lg:p-12 mb-12 text-center relative overflow-hidden holo-card border border-solaris-gold/30 shadow-depth">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.06)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="hud-label text-solaris-gold mb-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
              AI BRIDGE TO HIGH INTELLIGENCE
            </div>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
              Start mining in <span className="text-gradient-gold">minutes</span>.
            </h2>
            <p className="text-solaris-muted text-base lg:text-lg mb-8 max-w-lg mx-auto">
              Download the Solaris CET App. Connect a wallet. Begin earning on the bridge between current AI and High Intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://t.me/+tKlfzx7IWopmNWQ0"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-filled-gold flex items-center gap-2 group"
              >
                <Download className="w-4 h-4" />
                Start Mining on Telegram
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={WHITEPAPER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Read the Whitepaper
              </a>
            </div>
          </div>
        </div>

        {/* Founder Card */}
        <div className="bento-card p-6 mb-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-solaris-gold/30 bg-solaris-gold/10 flex items-center justify-center">
            {/* Founder avatar — LinkedIn profile */}
            <span className="font-display font-bold text-2xl text-solaris-gold">CB</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="hud-label text-solaris-gold text-[10px] mb-1">FOUNDER &amp; CREATOR</div>
            <h3 className="font-display font-semibold text-solaris-text text-lg leading-tight mb-0.5">
              Claudiu Ciprian Balaban
            </h3>
            <p className="text-solaris-muted text-sm">
              Visionary behind Solaris CET · AI &amp; Blockchain Strategist · Bridge between High Intelligence and decentralized finance on TON.
            </p>
          </div>
          <a
            href="https://www.linkedin.com/in/claudiu-ciprian-balaban-76ab8a394/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#4FC3F7] text-sm font-medium hover:bg-[#0A66C2]/30 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn Profile
          </a>
        </div>

        {/* Contract address */}
        <div className="bento-card p-4 mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="hud-label text-[10px] mb-1">CET Contract Address (TON)</div>
            <div className="font-mono text-xs text-solaris-muted truncate">{CET_CONTRACT_ADDRESS}</div>
          </div>
          <button
            onClick={handleCopyContract}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-solaris-gold/10 transition-colors"
            aria-label="Copy CET contract address"
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
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-solaris-gold/10 transition-colors"
            aria-label="Copy DeDust pool address"
          >
            {copiedPool
              ? <CheckCircle className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4 text-solaris-muted" />
            }
          </button>
        </div>

        {/* Newsletter */}
        <div ref={newsletterRef} className="bento-card p-6 lg:p-8 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-[#2AABEE]" />
                <span className="hud-label text-[#2AABEE]">Join the Community</span>
              </div>
              <p className="text-solaris-text">Get live updates, talk to the team, and follow the 200,000-agent build in real time.</p>
              <p className="text-solaris-muted text-xs mt-1">Telegram · Free · No spam · Instant access</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href="https://t.me/SolarisCET"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2AABEE]/10 border border-[#2AABEE]/30 text-[#2AABEE] font-semibold text-sm hover:bg-[#2AABEE]/20 transition-all duration-200 active:scale-95"
              >
                <Send className="w-4 h-4" />
                Join Telegram Channel
              </a>
              <a
                href="https://t.me/+tKlfzx7IWopmNWQ0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-solaris-gold/10 border border-solaris-gold/30 text-solaris-gold font-semibold text-sm hover:bg-solaris-gold/20 transition-all duration-200 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                Start Mining Bot
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer ref={footerRef} className="pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-3">
              <Sun className="w-8 h-8 text-solaris-gold animate-spin-slow" />
              <span className="font-display font-semibold text-lg text-solaris-text">
                Solaris <span className="text-solaris-gold">CET</span>
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-6">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
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
            <p className="text-solaris-muted text-sm">
              © {new Date().getFullYear()} Solaris CET. AI Bridge to High Intelligence. All rights reserved.
            </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
              <SocialShare />
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-solaris-gold font-semibold">₿</span>
                <span className="font-mono text-[11px] text-solaris-gold">POWERED BY BITCOIN</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400">LIVE ON TON MAINNET</span>
              </div>
            </div>
          </div>
          <p className="mt-6 text-center font-mono text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-solaris-gold/90 transition-all duration-700 cursor-default select-none">
            Architected by Claudiu
          </p>
        </footer>
      </div>
    </section>
  );
};

export default FooterSection;
