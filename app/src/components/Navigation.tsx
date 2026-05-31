import { useEffect, useMemo, useRef, useState } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { cn } from '@/lib/utils';

import { useLanguage } from '../hooks/useLanguage';
import { DownloadAppButton } from './company/DownloadAppButton';
import { SolarisLogoMark } from './SolarisLogoMark';

const MOBILE_MENU_FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number>(0);
  const isScrolledRef = useRef<boolean | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuContentRef = useRef<HTMLDivElement>(null);
  const wasMobileMenuOpenRef = useRef(false);
  const { t, lang } = useLanguage();
  const urlLocale = useMemo(() => urlLocaleFromLang(lang), [lang]);

  const navLinks = useMemo(
    () => {
      const pathnameNoLocale =
        typeof window === 'undefined'
          ? '/'
          : parseUrlLocaleFromPathname(window.location.pathname).pathnameNoLocale || '/';
      const isHome = pathnameNoLocale === '/';
      const homePath = localizePathname('/', urlLocale);
      const anchor = (id: string) => `${homePath}#${id}`;

      return [
        { key: 'home', label: t.nav.home, href: isHome ? '#hero' : homePath },
        { key: 'services', label: t.nav.services, href: isHome ? '#servicii' : anchor('servicii') },
        { key: 'products', label: t.nav.products, href: isHome ? '#produse' : anchor('produse') },
        { key: 'token', label: t.nav.cetToken, href: localizePathname('/token-cet', urlLocale) },
        { key: 'contact', label: t.nav.contact, href: localizePathname('/contact', urlLocale) },
      ];
    },
    [t.nav.cetToken, t.nav.contact, t.nav.home, t.nav.products, t.nav.services, urlLocale],
  );

  const [activeHref, setActiveHref] = useState<string>('/');

  useEffect(() => {
    const apply = () => {
      scrollRafRef.current = 0;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextIsScrolled = scrollTop > 80;
      const prevIsScrolled = isScrolledRef.current;
      if (prevIsScrolled === null || prevIsScrolled !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled;
        setIsScrolled(nextIsScrolled);
      }
      const nextProgress = docHeight > 0 ? Math.max(0, Math.min(100, (scrollTop / docHeight) * 100)) : 0;
      const bar = progressBarRef.current;
      if (bar) bar.style.width = `${nextProgress}%`;
    };

    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollRafRef.current) window.cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  useEffect(() => {
    const pathname = typeof window !== 'undefined' ? (window.location.pathname || '/') : '/';
    const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
    const best = navLinks.find((l) => l.href === normalized)?.href ?? (normalized.startsWith('/servicii') ? '/servicii' : normalized);
    setActiveHref(best);
  }, [navLinks]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      if (wasMobileMenuOpenRef.current) mobileMenuToggleRef.current?.focus();
      wasMobileMenuOpenRef.current = false;
      return;
    }
    wasMobileMenuOpenRef.current = true;
    const content = mobileMenuContentRef.current;
    if (!content) return;
    const focusable = content.querySelectorAll<HTMLElement>(MOBILE_MENU_FOCUSABLE_SELECTOR);
    tryFocusFirstFocusable(focusable);
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[1000] border-b transition-all duration-300 transform-gpu backface-hidden max-w-full overflow-x-hidden lg:overflow-x-visible',
        isScrolled
          ? 'bg-[rgba(10,10,30,0.85)] backdrop-blur-[20px] border-white/10 shadow-[0_1px_0_rgba(242,201,76,0.08),0_12px_36px_rgba(0,0,0,0.45)]'
          : 'bg-[rgba(10,10,30,0.55)] backdrop-blur-[20px] border-white/6',
      )}
      style={{ top: 'var(--solaris-announcement-offset, 0px)' }}
    >
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 h-[1px] transition-none"
        style={{
          width: '0%',
          background:
            'linear-gradient(90deg, var(--solaris-gold), var(--solaris-cyan), rgb(167 139 250), var(--solaris-gold))',
          backgroundSize: '200% 100%',
          animation: 'text-shimmer 3s linear infinite',
          boxShadow: '0 0 6px rgba(242,201,76,0.4)',
        }}
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden section-padding-x xl:px-12">
        <div className="flex h-16 w-full min-w-0 max-w-full items-center justify-between gap-2 sm:gap-3 lg:grid lg:h-20 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4 2xl:gap-6">
          <a
            href={localizePathname('/', urlLocale)}
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

          <nav
            className="hidden relative z-30 min-w-0 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] lg:flex lg:flex-nowrap lg:items-center lg:justify-center lg:gap-4 2xl:gap-6 [&::-webkit-scrollbar]:hidden"
            aria-label={t.nav.primaryNavigation}
          >
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={cn(
                  'shrink-0 text-sm transition-colors duration-300 relative group px-2 py-1.5',
                  activeHref === link.href ? 'text-solaris-text' : 'text-solaris-muted hover:text-solaris-text',
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

          <div className="relative z-20 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="lg:hidden">
              <DownloadAppButton className="px-3" />
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <DownloadAppButton />
              <a href="tel:+40769889721" className="btn-outline-white text-xs px-4 py-2 font-mono flex items-center gap-2">
                +40 769 889 721
              </a>
              <a href={navLinks.find((x) => x.key === 'contact')?.href ?? '/contact'} className="btn-filled-gold text-sm px-6 py-2">
                {t.nav.requestOffer}
              </a>
            </div>

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
                <span className="absolute left-0 top-[7px] h-0.5 w-7 rounded-full bg-current" />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-7 rounded-full bg-current" />
                <span className="absolute left-0 bottom-[7px] h-0.5 w-7 rounded-full bg-current" />
              </span>
            </button>
          </div>
        </div>
      </div>

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
          </SheetHeader>

          <nav
            className="flex flex-col flex-1 items-center px-6 sm:px-10 py-10 gap-2 min-h-0 w-full max-w-full"
            aria-label={t.nav.primaryNavigation}
          >
            {navLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="w-full max-w-[20rem] text-center py-4 text-[32px] leading-tight font-semibold text-solaris-muted hover:text-solaris-text transition-colors rounded-2xl hover:bg-white/[0.04]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="w-full max-w-[16rem] flex flex-col items-center gap-3 mt-8 pt-8 border-t border-white/8">
              <DownloadAppButton className="w-full justify-center" />
              <a href="tel:+40769889721" className="btn-outline-white text-sm w-full min-h-[48px] inline-flex items-center justify-center gap-2">
                +40 769 889 721
              </a>
              <a
                href={navLinks.find((x) => x.key === 'contact')?.href ?? '/contact'}
                className="btn-filled-gold text-sm w-full min-h-[48px] inline-flex items-center justify-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t.nav.requestOffer}
              </a>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
