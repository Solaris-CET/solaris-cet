import { useEffect, useState, useRef } from 'react';
import { Menu, X, Sun } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import WalletConnect from './WalletConnect';
import { useLanguage } from '../hooks/useLanguage';

const NAV_HREFS = [
  { key: 'cetApp',      href: '#nova-app'    },
  { key: 'tokenomics',  href: '#staking'     },
  { key: 'roadmap',     href: '#roadmap'     },
  { key: 'team',        href: '#team'        },
  { key: 'competition', href: '#competition' },
  { key: 'howToBuy',    href: '#how-to-buy'  },
  { key: 'resources',   href: '#resources'   },
  { key: 'faq',         href: '#faq'         },
] as const;

/**
 * Navigation — the fixed top navigation bar for the Solaris CET landing page.
 *
 * Features:
 * - Scroll-aware background blur: transparent at the top, frosted-glass when scrolled > 100 px.
 * - **Scroll progress bar** — a 1 px gradient line (`gold → cyan → gold`) along the
 *   bottom edge of the header that fills from left to right as the user scrolls.
 * - **"LIVE" badge** indicating the token is live on the TON mainnet.
 * - Desktop navigation links with animated underline-gradient hover effect.
 * - Responsive mobile hamburger menu.
 *
 * @returns The `<header>` element containing the full navigation bar.
 */
const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const navLinks = NAV_HREFS.map(({ key, href }) => ({
    label: t.nav[key],
    href,
  }));

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(scrollTop > 100);
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
        isScrolled
          ? 'bg-solaris-dark/90 backdrop-blur-2xl border-b border-white/6 shadow-[0_1px_0_rgba(242,201,76,0.06),0_8px_32px_rgba(0,0,0,0.4)]'
          : 'bg-transparent'
      }`}
    >
      {/* Scroll progress bar — animated shimmer */}
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 h-[2px] transition-none"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #F2C94C, #2EE7FF, #a78bfa, #F2C94C)',
          backgroundSize: '200% 100%',
          animation: 'text-shimmer 3s linear infinite',
          boxShadow: '0 0 8px rgba(242,201,76,0.6)',
        }}
      />

      <div className="w-full px-6 xl:px-12">
        <div className="flex items-center justify-between h-16 xl:h-20">
          {/* Logo */}
          <a href="#main-content" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 xl:w-10 xl:h-10">
              <Sun className="w-full h-full text-solaris-gold transition-transform duration-700 group-hover:rotate-180" />
              {/* Logo glow */}
              <div className="absolute inset-0 rounded-full bg-solaris-gold/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display font-semibold text-lg xl:text-xl text-solaris-text tracking-tight">
              Solaris <span className="text-solaris-gold">CET</span>
            </span>
          </a>

          {/* Desktop Navigation — shown only at xl (≥1280 px) to avoid overflow */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-solaris-muted hover:text-solaris-text transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-solaris-gold to-solaris-cyan transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden xl:flex items-center gap-3">
            <LanguageSelector />
            <WalletConnect />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-emerald-400">LIVE</span>
            </div>
            <button
              className="btn-gold text-sm"
              onClick={() => window.open('https://t.me/+tKlfzx7IWopmNWQ0', '_blank', 'noopener,noreferrer')}
              aria-label="Start Mining (opens in new window)"
            >
              Start Mining
            </button>
          </div>

          {/* Mobile / Tablet Menu Button — shown below xl (1280 px) */}
          <button
            className="xl:hidden p-2 text-solaris-text"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Menu — shown below xl (1280 px) */}
      <div
        id="mobile-menu"
        className={`xl:hidden absolute top-full left-0 right-0 bg-solaris-dark/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col p-6 gap-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-solaris-muted hover:text-solaris-text transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2">
            <LanguageSelector />
          </div>
          <div className="mt-2">
            <WalletConnect />
          </div>
          <button
            className="btn-gold text-sm mt-4"
            onClick={() => window.open('https://t.me/+tKlfzx7IWopmNWQ0', '_blank', 'noopener,noreferrer')}
            aria-label="Start Mining (opens in new window)"
          >
            Start Mining
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
