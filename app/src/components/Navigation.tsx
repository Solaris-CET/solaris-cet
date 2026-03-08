import { useEffect, useState, useRef } from 'react';
import { Menu, X, Sun } from 'lucide-react';

// Static data defined outside component to avoid re-creation on every render
const navLinks = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Whitepaper', href: '#whitepaper' },
  { label: 'Nova App', href: '#nova-app' },
  { label: 'Staking', href: '#staking' },
];

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
        isScrolled
          ? 'bg-solaris-dark/85 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      {/* Scroll progress bar */}
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-solaris-gold via-solaris-cyan to-solaris-gold transition-none"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="w-full px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 lg:w-10 lg:h-10">
              <Sun className="w-full h-full text-solaris-gold transition-transform duration-700 group-hover:rotate-180" />
              {/* Logo glow */}
              <div className="absolute inset-0 rounded-full bg-solaris-gold/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display font-semibold text-lg lg:text-xl text-solaris-text tracking-tight">
              Solaris <span className="text-solaris-gold">CET</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
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
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-emerald-400">LIVE</span>
            </div>
            <button
              className="btn-gold text-sm"
              onClick={() => window.open('https://t.me/SolarisCET', '_blank')}
              aria-label="Start Mining (opens in new window)"
            >
              Start Mining
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-solaris-text"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-solaris-dark/95 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${
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
          <button className="btn-gold text-sm mt-4">
            Start Mining
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
