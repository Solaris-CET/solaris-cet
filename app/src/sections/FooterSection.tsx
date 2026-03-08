import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Download, FileText, Mail, ArrowRight, Sun, Github, Twitter, MessageCircle, Send, Globe, Copy, CheckCircle } from 'lucide-react';

// Constants defined once to avoid duplication and maintain a single source of truth
const GITHUB_URL = 'https://github.com/aamclaudiu-hash/solaris-cet';
const DEDUST_POOL_ADDRESS = 'EQB5_hZPl4-EI1aWdLSd21c8T9PoKyZK2IJtrDFdPJIelfnB';
const DEDUST_SWAP_URL = `https://dedust.io/swap/TON/${DEDUST_POOL_ADDRESS}`;
const WHITEPAPER_URL = 'https://scarlet-past-walrus-15.mypinata.cloud/ipfs/bafkreieggm2l7favvjw4amybbobastjo6kcrdi33gzcvtzrur5opoivd3a';

// Static data defined outside component to avoid re-creation on every render
const footerLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'GitHub', href: GITHUB_URL, icon: Github },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', color: 'hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10' },
  { icon: MessageCircle, href: 'https://discord.gg', label: 'Discord', color: 'hover:text-[#5865F2] hover:bg-[#5865F2]/10' },
  { icon: Send, href: 'https://t.me/SolarisCET', label: 'Telegram', color: 'hover:text-[#2AABEE] hover:bg-[#2AABEE]/10' },
  { icon: Github, href: GITHUB_URL, label: 'GitHub', color: 'hover:text-solaris-text hover:bg-white/10' },
  { icon: Globe, href: DEDUST_SWAP_URL, label: 'DeDust', color: 'hover:text-solaris-gold hover:bg-solaris-gold/10' },
];

const FooterSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(DEDUST_POOL_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
    <section ref={sectionRef} className="relative bg-solaris-dark pt-16 pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] grid-floor opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-solaris-gold/20 to-transparent" />
      </div>

      <div className="relative z-10 px-6 lg:px-12 max-w-6xl mx-auto">
        {/* CTA Card */}
        <div ref={ctaCardRef} className="glass-card-gold p-8 lg:p-12 mb-12 text-center relative overflow-hidden holo-card">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(242,201,76,0.06)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="hud-label text-solaris-gold mb-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-solaris-gold animate-pulse" />
              AI BRIDGE TO HIGH INTELLIGENCE
            </div>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] text-solaris-text mb-4">
              Start mining in <span className="text-gradient-animated">minutes</span>.
            </h2>
            <p className="text-solaris-muted text-base lg:text-lg mb-8 max-w-lg mx-auto">
              Download Solaris Nova. Connect a wallet. Begin earning on the bridge between current AI and High Intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-filled-gold flex items-center gap-2 group">
                <Download className="w-4 h-4" />
                Download Nova App
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
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

        {/* Contract address */}
        <div className="glass-card p-4 mb-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="hud-label text-[10px] mb-1">DeDust Pool Address (TON)</div>
            <div className="font-mono text-xs text-solaris-muted truncate">{DEDUST_POOL_ADDRESS}</div>
          </div>
          <button
            onClick={handleCopyContract}
            className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-solaris-gold/10 transition-colors"
            aria-label="Copy contract address"
          >
            {copied
              ? <CheckCircle className="w-4 h-4 text-emerald-400" />
              : <Copy className="w-4 h-4 text-solaris-muted" />
            }
          </button>
        </div>

        {/* Newsletter */}
        <div ref={newsletterRef} className="glass-card p-6 lg:p-8 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-solaris-gold" />
                <span className="hud-label text-solaris-gold">Stay Updated</span>
              </div>
              <p className="text-solaris-text">Get network updates (no spam).</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 lg:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-solaris-text placeholder:text-solaris-muted/50 focus:outline-none focus:border-solaris-gold/50 transition-colors"
              />
              <button
                type="submit"
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${isSubscribed ? 'bg-emerald-400 text-solaris-dark' : 'btn-gold'}`}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
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
            <p className="text-solaris-muted/60 text-sm">
              © {new Date().getFullYear()} Solaris CET. AI Bridge to High Intelligence. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-emerald-400">LIVE ON TON MAINNET</span>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default FooterSection;
