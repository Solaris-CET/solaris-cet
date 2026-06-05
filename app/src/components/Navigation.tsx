import { useEffect, useMemo, useRef, useState } from 'react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { cn } from '@/lib/utils';

import { useLanguage } from '../hooks/useLanguage';
import { DownloadAppButton } from './company/DownloadAppButton';
import styles from './NavigationFloating.module.css';
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
  const scrollRafRef = useRef<number>(0);
  const isScrolledRef = useRef<boolean | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuContentRef = useRef<HTMLDivElement>(null);
  const wasMobileMenuOpenRef = useRef(false);
  const { t, lang } = useLanguage();
  const urlLocale = useMemo(() => urlLocaleFromLang(lang), [lang]);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const desktopLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

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
        { key: 'equipment', label: t.nav.equipment, href: isHome ? '#echipamente' : anchor('echipamente') },
        { key: 'portfolio', label: t.nav.portfolio, href: isHome ? '#proiecte' : anchor('proiecte') },
        { key: 'financing', label: t.nav.financing, href: localizePathname('/finantare', urlLocale) },
        { key: 'blog', label: t.nav.blog, href: localizePathname('/blog', urlLocale) },
        { key: 'about', label: t.nav.about, href: localizePathname('/despre', urlLocale) },
        { key: 'token', label: t.nav.cetToken, href: localizePathname('/token-cet', urlLocale) },
        { key: 'contact', label: t.nav.contact, href: localizePathname('/contact', urlLocale) },
      ];
    },
    [
      t.nav.about,
      t.nav.blog,
      t.nav.cetToken,
      t.nav.contact,
      t.nav.equipment,
      t.nav.financing,
      t.nav.home,
      t.nav.portfolio,
      t.nav.products,
      t.nav.services,
      urlLocale,
    ],
  );

  const businessLinks = useMemo(() => navLinks.filter((l) => l.key !== 'token'), [navLinks]);
  const tokenLinks = useMemo(() => navLinks.filter((l) => l.key === 'token'), [navLinks]);
  const primaryLinks = useMemo(() => {
    const pathnameNoLocale =
      typeof window === 'undefined'
        ? '/'
        : parseUrlLocaleFromPathname(window.location.pathname).pathnameNoLocale || '/';
    const isHome = pathnameNoLocale === '/';
    const homePath = localizePathname('/', urlLocale);
    return [
      { key: 'home', label: t.nav.home, href: isHome ? '#hero' : homePath },
      { key: 'services', label: t.nav.services, href: localizePathname('/servicii', urlLocale) },
      { key: 'contact', label: t.nav.contact, href: localizePathname('/contact', urlLocale) },
    ];
  }, [t.nav.contact, t.nav.home, t.nav.services, urlLocale]);

  const [activeHref, setActiveHref] = useState<string>('/');
  const [indicator, setIndicator] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  useEffect(() => {
    const apply = () => {
      scrollRafRef.current = 0;
      const scrollTop = window.scrollY;
      const nextIsScrolled = scrollTop > 80;
      const prevIsScrolled = isScrolledRef.current;
      if (prevIsScrolled === null || prevIsScrolled !== nextIsScrolled) {
        isScrolledRef.current = nextIsScrolled;
        setIsScrolled(nextIsScrolled);
      }
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
    const update = () => {
      const pathname = typeof window !== 'undefined' ? (window.location.pathname || '/') : '/';
      const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/';
      const best = normalized.startsWith('/servicii') ? '/servicii' : normalized.startsWith('/contact') ? '/contact' : '/';
      setActiveHref(best);
    };
    update();
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const container = desktopNavRef.current;
      if (!container) return;
      const el =
        (activeHref === '/servicii' ? desktopLinkRefs.current.services : null) ??
        (activeHref === '/contact' ? desktopLinkRefs.current.contact : null) ??
        desktopLinkRefs.current.home;
      if (!el) {
        setIndicator((p) => (p.visible ? { ...p, visible: false } : p));
        return;
      }
      const c = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const left = Math.max(0, r.left - c.left);
      const width = Math.max(0, r.width);
      setIndicator({ left, width, visible: width > 0 });
    };

    update();
    const onResize = () => update();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [activeHref]);

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

  const barHeightClass = isScrolled ? 'h-12' : 'h-16';

  return (
    <header
      data-reveal
      className={cn(
        `fixed top-0 left-0 right-0 z-[1000] max-w-full overflow-x-hidden lg:overflow-x-visible ${styles.bar}`,
        isScrolled
          ? 'bg-[rgba(5,6,11,0.85)] backdrop-blur-[20px] border-b border-white/10 shadow-[0_1px_0_rgba(251,146,60,0.10),0_16px_50px_rgba(0,0,0,0.55)]'
          : 'bg-[rgba(5,6,11,0.55)] backdrop-blur-[16px] border-b border-white/0',
      )}
      style={{ top: 'var(--solaris-announcement-offset, 0px)' }}
    >
      <div className="w-full min-w-0 max-w-full overflow-x-hidden section-padding-x xl:px-12">
        <div className={cn('flex w-full min-w-0 max-w-full items-center justify-between gap-2 sm:gap-3', barHeightClass)}>
          <a
            href={localizePathname('/', urlLocale)}
            className="group relative z-20 flex shrink-0 items-center gap-2"
            aria-label="Solaris CET"
          >
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-300" aria-hidden>
                <circle cx="12" cy="12" r="4.2" fill="currentColor" opacity="0.85" />
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  const x1 = 12 + Math.cos(a) * 7.2;
                  const y1 = 12 + Math.sin(a) * 7.2;
                  const x2 = 12 + Math.cos(a) * 10.4;
                  const y2 = 12 + Math.sin(a) * 10.4;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="currentColor"
                      strokeWidth="1"
                      opacity="0.55"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
            </span>
            <span className="leading-none">
              <span className="block text-sm font-black tracking-tight text-white">
                S<span className="text-orange-300">·</span>CET
              </span>
              <span className="block text-[11px] font-semibold tracking-widest text-white/55">SOLARIS</span>
            </span>
          </a>

          <nav
            className="hidden relative z-30 min-w-0 lg:flex lg:items-center lg:justify-center"
            aria-label={t.nav.primaryNavigation}
          >
            <div ref={desktopNavRef} className="relative flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur">
              {primaryLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  ref={(el) => {
                    desktopLinkRefs.current[link.key] = el;
                  }}
                  onClick={() => setActiveHref(link.key === 'services' ? '/servicii' : link.key === 'contact' ? '/contact' : '/')}
                  className={cn(
                    'relative z-10 px-4 py-2 text-sm font-semibold transition-colors',
                    (activeHref === '/servicii' && link.key === 'services') ||
                      (activeHref === '/contact' && link.key === 'contact') ||
                      (activeHref === '/' && link.key === 'home')
                      ? 'text-white'
                      : 'text-white/70 hover:text-white',
                  )}
                >
                  {link.label}
                </a>
              ))}
              <span
                aria-hidden
                className={cn(
                  `absolute bottom-1.5 h-[2px] rounded-full bg-orange-400 ${styles.indicator}`,
                  indicator.visible ? 'opacity-100' : 'opacity-0',
                )}
                style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }}
              />
            </div>
          </nav>

          <div className="relative z-20 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="lg:hidden">
              <DownloadAppButton className="px-3" />
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <a
                href="tel:+40769889721"
                className={cn(
                  `relative inline-flex items-center justify-center rounded-full border border-orange-400/45 bg-black/25 px-5 py-2 text-sm font-bold text-white backdrop-blur ${styles.pulseRing}`,
                )}
                aria-label="Sună acum la +40 769 889 721"
              >
                +40 769 889 721
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
            <div className="w-full max-w-[20rem] pb-2 text-center text-xs font-bold uppercase tracking-widest text-white/45">
              {t.nav.businessGroup}
            </div>
            {businessLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={cn(
                  `w-full max-w-[20rem] text-center py-4 text-[32px] leading-tight font-semibold text-solaris-muted hover:text-solaris-text transition-colors rounded-2xl hover:bg-white/[0.04] ${styles.overlayItem}`,
                )}
                style={{ animationDelay: `${Math.min(900, 120 + businessLinks.indexOf(link) * 70)}ms` }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="w-full max-w-[20rem] pt-6 pb-2 text-center text-xs font-bold uppercase tracking-widest text-white/45">
              {t.nav.tokenGroup}
            </div>
            {tokenLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={cn(
                  `w-full max-w-[20rem] text-center py-4 text-[32px] leading-tight font-semibold text-solaris-muted hover:text-solaris-text transition-colors rounded-2xl hover:bg-white/[0.04] ${styles.overlayItem}`,
                )}
                style={{ animationDelay: `${Math.min(900, 120 + (businessLinks.length + tokenLinks.indexOf(link)) * 70)}ms` }}
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
