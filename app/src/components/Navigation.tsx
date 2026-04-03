import { useCallback, useEffect, useState, useRef } from 'react';
import { ExternalLink, Menu } from 'lucide-react';
import { SolarisLogoMark } from './SolarisLogoMark';
import LanguageSelector from './LanguageSelector';
import WalletConnect from './WalletConnect';
import { useLanguage } from '../hooks/useLanguage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { standardSkillBurst, skillSeedFromLabel } from '@/lib/meshSkillFeed';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';

/**
 * Primary in-page destinations — flat IA, **7 items** (workspace target 5–7).
 * Global comparison `#competition` is linked from the footer + FAQ, not duplicated here.
 * Each `key` must exist on `Translations['nav']`; see `translations.test.ts`.
 */
const NAV_HREFS = [
  { key: 'cetApp',      href: '#nova-app'    },
  { key: 'tokenomics',  href: '#staking'     },
  { key: 'roadmap',     href: '#roadmap'     },
  { key: 'team',        href: '#team'        },
  { key: 'howToBuy',    href: '#how-to-buy'  },
  { key: 'resources',   href: '#resources'   },
  { key: 'faq',         href: '#faq'         },
] as const;

const MOBILE_MENU_FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Try each candidate until `focus()` sticks (iOS may ignore inert/hidden/disabled nodes). */
function tryFocusFirstFocusable(nodes: NodeListOf<HTMLElement>): void {
  for (const el of Array.from(nodes)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.hasAttribute('disabled')) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    if (el.closest('[hidden]')) continue;
    const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) continue;
    try {
      el.focus({ preventScroll: true });
    } catch {
      continue;
    }
    if (document.activeElement === el) return;
  }
}

/**
 * Navigation — the fixed top navigation bar for the Solaris CET landing page.
 *
 * Features:
 * - **Always-on frosted header** — light blur at the top, stronger glass + shadow after 100 px scroll.
 * - **Scroll progress bar** — a 1 px gradient line (`gold → cyan → gold`) along the
 *   bottom edge of the header that fills from left to right as the user scrolls.
 * - **"LIVE" badge** indicating the token is live on the TON mainnet.
 * - Desktop navigation links with animated underline-gradient hover effect.
 * - Below xl: hamburger opens a **right off-canvas sheet** with blurred backdrop (not an inline dropdown).
 *
 * @returns The `<header>` element containing the full navigation bar.
 */
const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuContentRef = useRef<HTMLDivElement>(null);
  /** True after the sheet has been opened at least once — avoids focusing the menu button on first mount. */
  const wasMobileMenuOpenRef = useRef(false);
  const { t } = useLanguage();

  const navLinks = NAV_HREFS.map(({ key, href }) => ({
    navKey: key,
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

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stable handler reference: same function instance for add + removeEventListener (no duplicate document listeners).
  const handleMobileMenuKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsMobileMenuOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;

    const content = mobileMenuContentRef.current;
    if (!content) return;

    const focusable = content.querySelectorAll<HTMLElement>(MOBILE_MENU_FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0] ?? null;
    const lastFocusable = focusable[focusable.length - 1] ?? null;
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === firstFocusable) {
      event.preventDefault();
      lastFocusable?.focus();
    } else if (!event.shiftKey && active === lastFocusable) {
      event.preventDefault();
      firstFocusable?.focus();
    }
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      if (wasMobileMenuOpenRef.current) {
        mobileMenuToggleRef.current?.focus();
      }
      wasMobileMenuOpenRef.current = false;
      return;
    }

    wasMobileMenuOpenRef.current = true;

    const content = mobileMenuContentRef.current;
    if (!content) return;

    const initialFocusable = content.querySelectorAll<HTMLElement>(MOBILE_MENU_FOCUSABLE_SELECTOR);
    tryFocusFirstFocusable(initialFocusable);

    document.addEventListener('keydown', handleMobileMenuKeyDown);
    return () => document.removeEventListener('keydown', handleMobileMenuKeyDown);
  }, [isMobileMenuOpen, handleMobileMenuKeyDown]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[1000] border-b transition-all duration-500',
        isScrolled
          ? 'bg-slate-950/88 backdrop-blur-2xl border-white/6 shadow-[0_1px_0_rgba(242,201,76,0.06),0_8px_32px_rgba(0,0,0,0.4)]'
          : 'bg-slate-950/50 backdrop-blur-xl border-white/[0.05]',
      )}
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

      <div className="w-full section-padding-x xl:px-12">
        <div className="flex items-center justify-between h-16 xl:h-20 gap-2 sm:gap-3">
          {/* Logo */}
          <a
            href="#main-content"
            className="flex items-center group min-w-0 shrink"
            aria-label="Solaris CET"
          >
            <div className="relative h-10 xl:h-11 shrink-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.04]">
              <SolarisLogoMark
                crop="full"
                priority
                className="h-10 xl:h-11 w-auto max-h-full drop-shadow-[0_0_14px_rgba(242,201,76,0.35)]"
              />
              <div className="pointer-events-none absolute inset-[-3px] rounded-xl bg-solaris-gold/18 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </a>

          {/* Desktop Navigation — shown only at xl (≥1280 px) to avoid overflow */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.navKey}
                href={link.href}
                className="text-sm text-solaris-muted hover:text-solaris-text transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-solaris-gold to-solaris-cyan transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* CTAs: persistent Buy on DeDust (< xl) + full desktop rail */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={DEDUST_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'btn-filled-gold inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 min-h-[44px] xl:min-h-0',
                'xl:hidden',
              )}
              aria-label={`${t.nav.buyOnDedust} ${t.nav.opensInNewWindow}`}
            >
              <span className="truncate max-w-[11rem] sm:max-w-none">{t.nav.buyOnDedust}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
            </a>

            <div className="hidden xl:flex items-center gap-3">
              <LanguageSelector />
              <WalletConnect />
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20"
                title={standardSkillBurst(skillSeedFromLabel('navHeader|liveMesh'))}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400">LIVE</span>
              </div>
              <a
                href={DEDUST_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-filled-gold text-sm inline-flex items-center gap-1.5 px-5 py-2.5"
                aria-label={`${t.nav.buyOnDedust} ${t.nav.opensInNewWindow}`}
              >
                {t.nav.buyOnDedust}
                <ExternalLink className="w-3.5 h-3.5 opacity-90" aria-hidden />
              </a>
              <button
                className="btn-gold text-sm"
                onClick={() => window.open('https://t.me/+tKlfzx7IWopmNWQ0', '_blank', 'noopener,noreferrer')}
                aria-label={`${t.hero.startMining} ${t.nav.opensInNewWindow}`}
              >
                {t.hero.startMining}
              </button>
            </div>

            {/* Mobile / Tablet Menu Button — shown below xl (1280 px) */}
            <button
              type="button"
              data-testid="mobile-menu-toggle"
              ref={mobileMenuToggleRef}
              className="xl:hidden p-2 text-solaris-text shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={t.nav.openMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Off-canvas navigation — blur handled by Sheet overlay + sheet panel */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          ref={mobileMenuContentRef}
          id="mobile-menu"
          side="right"
          overlayClassName="backdrop-blur-xl bg-slate-950/50"
          className={cn(
            'border-l border-white/10 bg-slate-950/92 backdrop-blur-2xl p-0 gap-0 shadow-[0_0_80px_rgba(0,0,0,0.65)]',
            'flex flex-col overflow-y-auto overscroll-contain',
            '[&>button]:top-5 [&>button]:right-5 [&>button]:size-10 [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center',
          )}
        >
          <SheetHeader className="p-6 sm:p-8 pb-4 border-b border-white/6 text-left shrink-0">
            <SheetTitle className="font-display text-lg text-solaris-text tracking-tight flex items-center gap-3">
              <span className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <SolarisLogoMark />
              </span>
              <span>
                Solaris <span className="text-solaris-gold">CET</span>
              </span>
            </SheetTitle>
            <SheetDescription className="sr-only">{t.nav.sheetDescription}</SheetDescription>
          </SheetHeader>

          <nav
            className="flex flex-col flex-1 items-center px-6 sm:px-8 md:px-10 py-8 gap-1 min-h-0 w-full max-w-full"
            aria-label={t.nav.primaryNavigation}
          >
            {navLinks.map((link) => (
              <a
                key={link.navKey}
                href={link.href}
                className="w-full max-w-[16rem] text-center py-3.5 text-base text-solaris-muted hover:text-solaris-text transition-colors rounded-xl hover:bg-white/[0.04]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="w-full max-w-[16rem] flex flex-col items-center gap-6 mt-8 pt-8 border-t border-white/8">
              <a
                href={DEDUST_SWAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-filled-gold text-sm w-full max-w-[16rem] min-h-[48px] inline-flex items-center justify-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={`${t.nav.buyOnDedust} ${t.nav.opensInNewWindow}`}
              >
                {t.nav.buyOnDedust}
                <ExternalLink className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
              </a>
              <div className="w-full flex flex-col items-center gap-4">
                <LanguageSelector />
                <WalletConnect />
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20"
                title={standardSkillBurst(skillSeedFromLabel('navSheet|liveMesh'))}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400">LIVE</span>
              </div>
              <button
                type="button"
                className="btn-gold text-sm w-full max-w-[16rem] min-h-[48px]"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  window.open('https://t.me/+tKlfzx7IWopmNWQ0', '_blank', 'noopener,noreferrer');
                }}
                aria-label={`${t.hero.startMining} ${t.nav.opensInNewWindow}`}
              >
                {t.hero.startMining}
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Navigation;
