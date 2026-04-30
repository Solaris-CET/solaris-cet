import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef,useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSpecialNftBadge } from '@/hooks/useSpecialNftBadge';
import { useTonNetwork } from '@/hooks/useTonNetwork';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { DEDUST_SWAP_URL } from '@/lib/dedustUrls';
import { skillSeedFromLabel,standardSkillBurst } from '@/lib/meshSkillFeed';
import { NAV_PRIMARY_IN_PAGE } from '@/lib/navPrimaryHrefs';
import { cn } from '@/lib/utils';

import { useLanguage } from '../hooks/useLanguage';
import HeaderPriceTicker from './HeaderPriceTicker';
import { HeaderTrustStrip } from './HeaderTrustStrip';
import LanguageSelector from './LanguageSelector';
import RegionSelector from './RegionSelector';
import { SolarisLogoMark } from './SolarisLogoMark';
import ThemeToggle from './ThemeToggle';
import WalletBalance from './WalletBalance';
import WalletConnect from './WalletConnect';

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
  const { t, lang } = useLanguage();
  const { network, setNetwork } = useTonNetwork();
  const { hasSpecial } = useSpecialNftBadge();

  const navLinks = useMemo(
    () =>
      NAV_PRIMARY_IN_PAGE.map(({ navKey, href }) => {
        const locale = urlLocaleFromLang(lang);
        const baseHref = href.startsWith('/') ? localizePathname(href, locale) : href;
        const withLang = typeof window !== 'undefined' && baseHref.startsWith('/') ? `${baseHref}${window.location.search}` : baseHref;
        return {
          navKey,
          label: t.nav[navKey],
          href: withLang,
        };
      }),
    [t, lang],
  );

  const currentPathNoLocale = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    return parseUrlLocaleFromPathname(window.location.pathname).pathnameNoLocale;
  }, []);
  const isRouteMode = currentPathNoLocale !== '/';

  const primaryDesktopHrefs = useMemo(() => new Set(navLinks.slice(0, 4).map((l) => l.href)), [navLinks]);
  const [activeHref, setActiveHref] = useState<string>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') || '/' : '/';
    const routeMatch = navLinks.find((l) => l.href.startsWith('/') && l.href.split('?')[0] === path);
    if (routeMatch) return routeMatch.href;
    if (navLinks.some((l) => l.href === hash)) return hash;
    return navLinks[0]?.href ?? '#';
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(scrollTop > 80);
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isRouteMode) return;
    const sections = navLinks.flatMap((link) => {
      const id = link.href.startsWith('#') ? link.href.slice(1) : '';
      const el = id ? document.getElementById(id) : null;
      return el ? [{ el, href: link.href }] : [];
    });

    if (sections.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const href = `#${(entry.target as HTMLElement).id}`;
          if (!navLinks.some((l) => l.href === href)) continue;
          ratios.set(href, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestHref = activeHref;
        let bestRatio = ratios.get(bestHref) ?? 0;
        for (const link of navLinks) {
          const r = ratios.get(link.href) ?? 0;
          if (r > bestRatio + 0.02) {
            bestRatio = r;
            bestHref = link.href;
          }
        }
        if (bestHref !== activeHref) setActiveHref(bestHref);
      },
      {
        threshold: [0.15, 0.25, 0.4, 0.6],
        rootMargin: '-25% 0px -60% 0px',
      },
    );

    for (const s of sections) observer.observe(s.el);
    return () => observer.disconnect();
  }, [navLinks, activeHref, isRouteMode]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.matchMedia !== 'function') return;
    const mm = window.matchMedia('(max-width: 1023px)');
    if (!mm.matches) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let edgeStart = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      edgeStart = startX <= 24;
      tracking = isMobileMenuOpen || edgeStart;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) return;

      if (!isMobileMenuOpen && edgeStart && dx > 70) {
        setIsMobileMenuOpen(true);
        tracking = false;
        return;
      }
      if (isMobileMenuOpen && dx < -70) {
        setIsMobileMenuOpen(false);
        tracking = false;
      }
    };

    const onEnd = () => {
      tracking = false;
      edgeStart = false;
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        /* transform-gpu: Chromium composites fixed + backdrop-filter more reliably */
        'fixed top-0 left-0 right-0 z-[1000] border-b transition-all duration-300 transform-gpu backface-hidden',
        isScrolled
          ? 'bg-[rgba(10,10,30,0.85)] backdrop-blur-[20px] border-white/10 shadow-[0_1px_0_rgba(242,201,76,0.08),0_12px_36px_rgba(0,0,0,0.45)]'
          : 'bg-[rgba(10,10,30,0.55)] backdrop-blur-[20px] border-white/6',
      )}
      style={{ top: 'var(--solaris-announcement-offset, 0px)' }}
    >
      {/* Scroll progress bar — animated shimmer */}
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 h-[1px] transition-none"
        style={{
          width: `${scrollProgress}%`,
          background:
            'linear-gradient(90deg, var(--solaris-gold), var(--solaris-cyan), rgb(167 139 250), var(--solaris-gold))',
          backgroundSize: '200% 100%',
          animation: 'text-shimmer 3s linear infinite',
          boxShadow: '0 0 6px rgba(242,201,76,0.4)',
        }}
      />

      <div className="w-full section-padding-x xl:px-12">
        {/*
          Below xl: flex [logo | CTAs] — nav is display:none (omitted from flow).
          xl+: CSS grid [logo | nav | CTAs] — nav is centered only inside the middle track, so wide link rows
          cannot shift left over the logo (flex+justify-center on a shared row caused that overlap + z-index clash).
        */}
        <div className="flex h-16 w-full items-center justify-between gap-2 sm:gap-3 lg:grid lg:h-20 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4 2xl:gap-6">
          <a
            href={isRouteMode ? '/' : '#main-content'}
            className="group relative z-20 flex shrink-0 items-center"
            aria-label="Solaris CET"
          >
            <div className="relative flex h-10 shrink-0 origin-left items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.04] lg:h-11">
              <SolarisLogoMark
                crop="full"
                priority
                className="h-10 lg:h-11 w-auto max-h-full drop-shadow-[0_0_14px_rgba(242,201,76,0.35)]"
              />
              <div className="pointer-events-none absolute inset-[-3px] rounded-xl bg-solaris-gold/18 blur-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </a>

          {/* Desktop Navigation — middle column only; cannot paint under the logo column */}
          <nav
            className="hidden relative z-30 min-w-0 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] lg:flex lg:flex-nowrap lg:items-center lg:justify-center lg:gap-4 2xl:gap-6 [&::-webkit-scrollbar]:hidden"
            aria-label={t.nav.primaryNavigation}
          >
            {navLinks.map((link) => (
              <a
                key={link.navKey}
                href={link.href}
                className={cn(
                  'shrink-0 text-sm transition-colors duration-300 relative group px-2 py-1.5',
                  activeHref === link.href
                    ? 'text-solaris-text'
                    : primaryDesktopHrefs.has(link.href)
                      ? 'text-solaris-muted hover:text-solaris-text'
                      : 'text-solaris-muted/70 hover:text-solaris-muted',
                )}
              >
                {link.label}
                <span
                  className={cn(
                    'absolute -bottom-1 left-2 right-2 h-px origin-left scale-x-0 bg-gradient-to-r from-solaris-gold via-solaris-cyan to-solaris-gold transition-transform duration-300',
                    activeHref === link.href ? 'scale-x-100' : 'group-hover:scale-x-100',
                  )}
                />
              </a>
            ))}
          </nav>

          {/* CTAs: persistent Buy on DeDust (< lg) + full desktop rail */}
          <div className="relative z-20 flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={DEDUST_SWAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'btn-filled-gold inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2.5 min-h-[44px] lg:min-h-0',
                'lg:hidden',
              )}
              aria-label={`${t.nav.buyOnDedust} ${t.nav.opensInNewWindow}`}
            >
              <span className="truncate max-w-[11rem] sm:max-w-none">{t.nav.buyOnDedust}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden />
            </a>

            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-3">
                <LanguageSelector />
                <RegionSelector />
                <ThemeToggle />
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <WalletConnect />
                <WalletBalance />
                <HeaderTrustStrip />
              </div>
              {hasSpecial ? (
                <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                  <span className="text-[10px] font-mono text-emerald-200">SPECIAL NFT</span>
                </div>
              ) : null}
              <HeaderPriceTicker />
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  className={cn(
                    'px-2 py-1 rounded-full text-[10px] font-mono transition-colors',
                    network === 'mainnet' ? 'bg-solaris-gold/20 text-solaris-gold' : 'text-solaris-muted hover:text-solaris-text',
                  )}
                  onClick={() => setNetwork('mainnet')}
                  aria-pressed={network === 'mainnet'}
                >
                  MAIN
                </button>
                <button
                  type="button"
                  className={cn(
                    'px-2 py-1 rounded-full text-[10px] font-mono transition-colors',
                    network === 'testnet' ? 'bg-cyan-400/15 text-cyan-200' : 'text-solaris-muted hover:text-solaris-text',
                  )}
                  onClick={() => setNetwork('testnet')}
                  aria-pressed={network === 'testnet'}
                >
                  TEST
                </button>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full border',
                  network === 'mainnet'
                    ? 'bg-emerald-400/10 border-emerald-400/20'
                    : 'bg-cyan-400/10 border-cyan-400/20',
                )}
                title={standardSkillBurst(skillSeedFromLabel('navHeader|liveMesh'))}
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full animate-pulse',
                    network === 'mainnet' ? 'bg-emerald-400' : 'bg-cyan-300',
                  )}
                />
                <span className={cn('font-mono text-[11px]', network === 'mainnet' ? 'text-emerald-400' : 'text-cyan-200')}>
                  {network === 'mainnet' ? 'LIVE' : 'TESTNET'}
                </span>
              </div>
            </div>

            {/* Mobile / Tablet Menu Button — shown below lg (1024 px) */}
            <button
              type="button"
              data-testid="mobile-menu-toggle"
              ref={mobileMenuToggleRef}
              className="lg:hidden p-2 text-solaris-text shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label={t.nav.openMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="relative block h-7 w-7" aria-hidden>
                <span
                  className={cn(
                    'absolute left-0 top-[7px] h-0.5 w-7 rounded-full bg-current transition-transform duration-300',
                    isMobileMenuOpen && 'translate-y-[7px] rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-7 rounded-full bg-current transition-opacity duration-200',
                    isMobileMenuOpen && 'opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'absolute left-0 bottom-[7px] h-0.5 w-7 rounded-full bg-current transition-transform duration-300',
                    isMobileMenuOpen && '-translate-y-[7px] -rotate-45',
                  )}
                />
              </span>
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
          overlayClassName="backdrop-blur-[20px] bg-[rgba(10,10,30,0.55)]"
          className={cn(
            'border-l border-white/10 bg-slate-950/92 backdrop-blur-2xl p-0 gap-0 shadow-[0_0_80px_rgba(0,0,0,0.65)]',
            'flex flex-col overflow-y-auto overscroll-contain',
            'w-[100dvw] max-w-[100dvw] h-[100svh] h-dvh sm:max-w-none',
            '[&>button]:top-5 [&>button]:right-5 [&>button]:size-10 [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center',
          )}
        >
          <SheetHeader className="p-6 sm:p-8 pb-4 border-b border-white/6 text-left shrink-0">
            <SheetTitle className="font-display text-lg text-solaris-text tracking-tight flex items-center gap-3">
              <span className="relative w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <SolarisLogoMark className="h-full w-full" />
              </span>
              <span>
                Solaris <span className="text-solaris-gold">CET</span>
              </span>
            </SheetTitle>
            <SheetDescription className="sr-only">{t.nav.sheetDescription}</SheetDescription>
          </SheetHeader>

          <nav
            className="flex flex-col flex-1 items-center px-6 sm:px-10 py-10 gap-2 min-h-0 w-full max-w-full"
            aria-label={t.nav.primaryNavigation}
          >
            {navLinks.map((link) => (
              <a
                key={link.navKey}
                href={link.href}
                className="w-full max-w-[20rem] text-center py-4 text-[32px] leading-tight font-semibold text-solaris-muted hover:text-solaris-text transition-colors rounded-2xl hover:bg-white/[0.04]"
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
                <RegionSelector />
                <ThemeToggle />
                <div className="w-full flex flex-col items-center gap-2">
                  <WalletConnect />
                  <WalletBalance className="justify-center" />
                  <HeaderTrustStrip align="center" />
                </div>
              </div>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                  network === 'mainnet'
                    ? 'bg-emerald-400/10 border-emerald-400/20'
                    : 'bg-cyan-400/10 border-cyan-400/20',
                )}
                title={standardSkillBurst(skillSeedFromLabel('navSheet|liveMesh'))}
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full animate-pulse',
                    network === 'mainnet' ? 'bg-emerald-400' : 'bg-cyan-300',
                  )}
                />
                <span className={cn('font-mono text-[11px]', network === 'mainnet' ? 'text-emerald-400' : 'text-cyan-200')}>
                  {network === 'mainnet' ? 'LIVE' : 'TESTNET'}
                </span>
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
