import './App.css';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { AnalyticsBootstrap } from '@/components/AnalyticsBootstrap';
import { CinematicBackground } from '@/components/CinematicBackground';
import { InteractionEffectsManager } from '@/components/InteractionEffectsManager';
import { MarketingBootstrap } from '@/components/MarketingBootstrap';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';
import { RouteTransition } from '@/components/RouteTransition';
import { Toaster } from '@/components/ui/sonner';
import {
  localizePathname,
  parseUrlLocaleFromPathname,
  shouldLocalePrefixPathname,
  URL_LOCALES,
  urlLocaleFromLang,
} from '@/i18n/urlRouting';
import { getBlogPost } from '@/lib/blog';
import { PRODUCTION_SITE_ORIGIN } from '@/lib/brandAssets';
import { subscribePush } from '@/lib/pushClient';
import { applySpaSeo } from '@/lib/spaSeo';

import AnnouncementBanner from './components/AnnouncementBanner';
import BackToTop from './components/BackToTop';
import { BuildSeal } from './components/BuildSeal';
import { CetSymbol } from './components/CetSymbol';
import CookieConsentBanner from './components/CookieConsentBanner';
import CursorGlow from './components/CursorGlow';
import CustomCursor from './components/CustomCursor';
import { MobileAppNav } from './components/MobileAppNav';
import MobileConversionDock from './components/MobileConversionDock';
import Navigation from './components/Navigation';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import RouteSignatureLayer from './components/RouteSignatureLayer';
import ScrollStoryOverlay from './components/ScrollStoryOverlay';
import { SolarisLogoMark } from './components/SolarisLogoMark';
import StatusBar from './components/StatusBar';
import { useAsyncCssReady } from './hooks/useAsyncCssReady';
import { JwtSessionContext, useJwtSessionState } from './hooks/useJwtSession';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { useReducedMotion } from './hooks/useReducedMotion';
import { RegionContext, useRegionState } from './hooks/useRegion';
import { useSmoothAnchors } from './hooks/useSmoothAnchors';
import { useTelegram } from './hooks/useTelegram';
import { TonNetworkContext, useTonNetworkState } from './hooks/useTonNetwork';
import { shortSkillWhisper, skillSeedFromLabel } from './lib/meshSkillFeed';
import { NotFoundPage } from './pages/NotFoundPage';

const HomePage = lazy(() => import('./pages/HomePage'));
const CetuiaMapPage = lazy(() => import('./pages/CetuiaMapPage'));
const RwaPage = lazy(() => import('./pages/RwaPage'));
const CetAiPage = lazy(() => import('./pages/CetAiPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const ResponsibleDisclosurePage = lazy(() => import('./pages/ResponsibleDisclosurePage'));
const BugBountyPage = lazy(() => import('./pages/BugBountyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DevelopersPage = lazy(() => import('./pages/DevelopersPage'));
const DeveloperConsolePage = lazy(() => import('./pages/DeveloperConsolePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const TokenomicsPage = lazy(() => import('./pages/TokenomicsPage'));
const NftsPage = lazy(() => import('./pages/NftsPage'));
const AirdropPage = lazy(() => import('./pages/AirdropPage'));
const TxHistoryPage = lazy(() => import('./pages/TxHistoryPage'));
const StakingPage = lazy(() => import('./pages/StakingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ShareTargetPage = lazy(() => import('./pages/ShareTargetPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ContractPage = lazy(() => import('./pages/ContractPage'));
const DefiHubPage = lazy(() => import('./pages/DefiHubPage'));
const TechnicalAnalysisPage = lazy(() => import('./pages/TechnicalAnalysisPage'));
const NewsletterVerifyPage = lazy(() => import('./pages/NewsletterVerifyPage'));
const NewsletterUnsubscribePage = lazy(() => import('./pages/NewsletterUnsubscribePage'));
const ReleaseNotesPage = lazy(() => import('./pages/ReleaseNotesPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BrandAssetsPage = lazy(() => import('./pages/BrandAssetsPage'));
const WhitepaperPage = lazy(() => import('./pages/WhitepaperPage'));
const LegalDocPage = lazy(() => import('./pages/LegalDocPage'));
const PrivacySettingsPage = lazy(() => import('./pages/PrivacySettingsPage'));

const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const ForumPage = lazy(() => import('./pages/ForumPage'));
const ForumPostPage = lazy(() => import('./pages/ForumPostPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const NewsletterConfirmPage = lazy(() => import('./pages/NewsletterConfirmPage'));
const PaidLandingPage = lazy(() => import('./pages/PaidLandingPage'));
const PrelaunchPage = lazy(() => import('./pages/PrelaunchPage'));
const ThanksPage = lazy(() => import('./pages/ThanksPage'));
const CountryLandingPage = lazy(() => import('./pages/CountryLandingPage'));

gsap.registerPlugin(ScrollTrigger);

/** Brief shell warm-up; shorter than earlier builds to avoid artificial wait (B2B credibility). */
const LOADING_DURATION_MS = 450;
/** Skip fixed delay when user requests reduced motion (WCAG 2.3.3). */
const LOADING_DURATION_REDUCED_MS = 0;

function AppContent() {
  useTelegram();
  void PrivacySettingsPage;
  void DefiHubPage;
  void TechnicalAnalysisPage;
  void CountryLandingPage;
  void ProfilePage;
  void ContractPage;
  const mainRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const snapTriggerRef = useRef<ScrollTrigger | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [locationKey, setLocationKey] = useState(0);
  const langState = useLanguageState();
  const regionState = useRegionState();
  const tonNetworkState = useTonNetworkState();
  const jwtState = useJwtSessionState();
  const jwtToken = jwtState.token;
  const setJwtToken = jwtState.setToken;
  const isLhci = import.meta.env.VITE_LHCI === '1';
  const prefersReducedMotion = useReducedMotion();
  const cssReady = useAsyncCssReady();

  useSmoothAnchors();
  const pathnameRaw = typeof window === 'undefined' ? '/' : window.location.pathname || '/';
  const parsedPath = parseUrlLocaleFromPathname(pathnameRaw);
  const activeUrlLocale = parsedPath.locale ?? urlLocaleFromLang(langState.lang);
  const routePath = (parsedPath.pathnameNoLocale.replace(/\/$/, '') || '/').replace('/index.html', '/') || '/';

  useEffect(() => {
    const bump = () => setLocationKey((k) => k + 1);
    window.addEventListener('popstate', bump);
    window.addEventListener('hashchange', bump);
    return () => {
      window.removeEventListener('popstate', bump);
      window.removeEventListener('hashchange', bump);
    };
  }, []);

  useEffect(() => {
    const raw = String(import.meta.env.VITE_SESSION_IDLE_SECONDS ?? '').trim();
    const idleSeconds = raw ? Number.parseInt(raw, 10) : 0;
    if (!jwtToken) return;
    if (!Number.isFinite(idleSeconds) || idleSeconds <= 0) return;
    if (typeof window === 'undefined') return;

    let last = Date.now();
    const bump = () => {
      last = Date.now();
    };

    window.addEventListener('mousemove', bump, { passive: true });
    window.addEventListener('keydown', bump);
    window.addEventListener('scroll', bump, { passive: true });
    window.addEventListener('touchstart', bump, { passive: true });

    const t = window.setInterval(() => {
      if (Date.now() - last > idleSeconds * 1000) {
        setJwtToken(null);
      }
    }, 5_000);

    return () => {
      window.clearInterval(t);
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('scroll', bump);
      window.removeEventListener('touchstart', bump);
    };
  }, [jwtToken, setJwtToken]);

  useEffect(() => {
    const isInternal = (url: URL) => url.origin === window.location.origin;
    const shouldSkip = (a: HTMLAnchorElement) => {
      if (a.hasAttribute('download')) return true;
      const target = (a.getAttribute('target') ?? '').toLowerCase();
      if (target && target !== '_self') return true;
      if (a.getAttribute('rel')?.includes('external')) return true;
      if (a.getAttribute('data-no-spa') === '1') return true;
      return false;
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const a = (t.tagName.toLowerCase() === 'a' ? (t as HTMLAnchorElement) : t.closest('a')) as HTMLAnchorElement | null;
      if (!a) return;
      if (shouldSkip(a)) return;
      const href = a.getAttribute('href') ?? '';
      if (!href || href === '#') return;
      if (href.startsWith('#')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (!isInternal(url)) return;
      if (url.pathname.startsWith('/api/')) return;
      if (url.pathname === '/audit' || url.pathname.startsWith('/audit/')) return;
      if (url.pathname.startsWith('/sovereign/') || url.pathname.startsWith('/apocalypse/')) return;

      e.preventDefault();
      window.history.pushState(null, '', url.toString());
      setLocationKey((k) => k + 1);

      if (url.hash) {
        const el = document.querySelector(url.hash);
        if (el) {
          requestAnimationFrame(() => {
            const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          });
        }
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const parsed = parseUrlLocaleFromPathname(url.pathname);

    const normalizePath = (p: string) => (p !== '/' ? p.replace(/\/$/, '') : '/');

    const qpLang = url.searchParams.get('lang');
    const qpLocale = qpLang ? qpLang.slice(0, 2).toLowerCase() : '';
    if (qpLocale && (URL_LOCALES as readonly string[]).includes(qpLocale)) {
      url.pathname = localizePathname(parsed.pathnameNoLocale, qpLocale as (typeof URL_LOCALES)[number]);
      url.searchParams.delete('lang');
      window.location.replace(url.toString());
      return;
    }

    if (parsed.locale) {
      const isBlogPath =
        parsed.pathnameNoLocale === '/blog' || parsed.pathnameNoLocale.startsWith('/blog/');
      const isBlogLocale = parsed.locale === 'en' || parsed.locale === 'ro' || parsed.locale === 'es';
      if (isBlogPath && !isBlogLocale) {
        url.pathname = localizePathname(parsed.pathnameNoLocale, 'en');
        window.location.replace(url.toString());
        return;
      }

      const canonical = localizePathname(parsed.pathnameNoLocale, parsed.locale);
      if (normalizePath(url.pathname) !== normalizePath(canonical)) {
        url.pathname = canonical;
        window.location.replace(url.toString());
      }
      return;
    }

    if (!shouldLocalePrefixPathname(url.pathname)) return;
    const localized = localizePathname(parsed.pathnameNoLocale, activeUrlLocale);
    if (normalizePath(url.pathname) !== normalizePath(localized)) {
      url.pathname = localized;
      url.searchParams.delete('lang');
      window.location.replace(url.toString());
    }
  }, [activeUrlLocale]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = activeUrlLocale;
  }, [activeUrlLocale]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as unknown;
      if (!data || typeof data !== 'object') return;
      const t = data as { type?: unknown; url?: unknown };
      if (t.type === 'NAVIGATE' && typeof t.url === 'string') {
        window.location.assign(t.url);
        return;
      }
      if (t.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        try {
          localStorage.setItem('solaris_push_resubscribe', '1');
        } catch {
          void 0;
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!jwtState.token) return;
    const token = jwtState.token;
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try {
      if (localStorage.getItem('solaris_push_resubscribe') !== '1') return;
    } catch {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/account/profile', {
          method: 'GET',
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => null)) as { ok?: unknown; preferences?: { pushEnabled?: unknown } } | null;
        const pushEnabled = Boolean(json?.ok && json?.preferences?.pushEnabled);
        if (!pushEnabled) {
          try {
            localStorage.removeItem('solaris_push_resubscribe');
          } catch {
            void 0;
          }
          return;
        }
        if (cancelled) return;
        await subscribePush(token);
        try {
          localStorage.removeItem('solaris_push_resubscribe');
        } catch {
          void 0;
        }
      } catch {
        void 0;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jwtState.token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const ref = (url.searchParams.get('ref') ?? '').trim();
    const invite = (url.searchParams.get('invite') ?? '').trim();
    try {
      if (ref) localStorage.setItem('solaris_ref', ref);
      if (invite) localStorage.setItem('solaris_invite', invite);
    } catch {
      void 0;
    }
    if (ref) {
      void fetch('/api/gamification/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      }).catch(() => null);
    }
  }, []);

  useEffect(() => {
    const loadingEl = loadingRef.current;
    const isSeen =
      typeof window !== 'undefined' &&
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('solaris_intro_seen') === '1';
    const delayMs = prefersReducedMotion || isSeen ? LOADING_DURATION_REDUCED_MS : LOADING_DURATION_MS;
    const fadeOutSec = prefersReducedMotion ? 0.12 : 0.55;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('solaris_intro_seen', '1');
      }

      if (!loadingEl) {
        setIsLoaded(true);
        return;
      }

      loadingEl.style.pointerEvents = 'none';
      setIsLoaded(true);
      gsap.to(loadingEl, {
        opacity: 0,
        duration: fadeOutSec,
        ease: prefersReducedMotion ? 'none' : 'power3.out',
        onComplete: () => {
          loadingEl.style.display = 'none';
        },
      });
    };

    const timer = window.setTimeout(finish, delayMs);
    const safety = window.setTimeout(finish, 3000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(safety);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    // Ensure all ScrollTriggers are released if AppContent unmounts (HMR, route-level remounts).
    return () => {
      ScrollTrigger.getAll().forEach((st: ScrollTrigger) => st.kill());
    };
  }, []);

  const buildSnapTo = useCallback((pinnedRanges: { start: number; end: number; center: number }[]) => {
    return (value: number) => {
      const inPinned = pinnedRanges.some(
        (r) => value >= r.start - 0.02 && value <= r.end + 0.02,
      );
      if (!inPinned) return value;

      let closest = pinnedRanges[0]?.center ?? value;
      let closestDist = Math.abs(closest - value);
      for (let i = 1; i < pinnedRanges.length; i += 1) {
        const dist = Math.abs(pinnedRanges[i].center - value);
        if (dist < closestDist) {
          closestDist = dist;
          closest = pinnedRanges[i].center;
        }
      }
      return closest;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (routePath !== '/') return;

    // Below 1024 px (tablets/small laptops), free scrolling is more natural
    const isBelowDesktop = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
    if (isBelowDesktop) return;
    if (prefersReducedMotion) return;

    const setupSnap = () => {
      const pinned = ScrollTrigger.getAll()
        .filter((st: ScrollTrigger) => st.vars.pin)
        .sort((a: ScrollTrigger, b: ScrollTrigger) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map((st: ScrollTrigger) => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      snapTriggerRef.current?.kill();
      snapTriggerRef.current = ScrollTrigger.create({
        snap: {
          snapTo: buildSnapTo(pinnedRanges),
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    };

    if (!cssReady) return;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setupSnap();
      });
    };

    const onRefresh = () => schedule();
    (ScrollTrigger as unknown as { addEventListener: (e: string, cb: () => void) => void }).addEventListener(
      'refresh',
      onRefresh,
    );
    window.addEventListener('load', schedule, { once: true });

    schedule();
    const timer = window.setTimeout(schedule, 900);
    return () => {
      (ScrollTrigger as unknown as { removeEventListener: (e: string, cb: () => void) => void }).removeEventListener(
        'refresh',
        onRefresh,
      );
      window.clearTimeout(timer);
      if (raf) window.cancelAnimationFrame(raf);
      snapTriggerRef.current?.kill();
      snapTriggerRef.current = null;
    };
  }, [isLoaded, buildSnapTo, routePath, prefersReducedMotion, cssReady]);

  /** When the server serves `index.html` for a route, scroll to the matching section after lazy sections mount. */
  useEffect(() => {
    if (!isLoaded) return;
    const path = routePath;
    const routeToSectionId: Record<string, string> = {
      '/mining': 'mining',
      '/rwa': 'rwa',
      '/cet-ai': 'cet-ai',
    };
    const targetId = routeToSectionId[path];
    if (!targetId) return;

    const maxWaitMs = 12_000;
    const started = performance.now();
    const id = window.setInterval(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        window.clearInterval(id);
        return;
      }
      if (performance.now() - started > maxWaitMs) {
        window.clearInterval(id);
      }
    }, 120);

    return () => window.clearInterval(id);
  }, [isLoaded, routePath, prefersReducedMotion]);

  useEffect(() => {
    const seo = (langState.t as unknown as { seo?: Record<string, string> }).seo ?? {};
    const baseKeywords =
      'Solaris CET, CET token, TON blockchain, RWA token, DeDust, RAV protocol, Grok, Gemini, dual AI, autonomous agents';
    const routeMeta: Record<string, { title: string; description: string; keywords?: string; noindex?: boolean }> = {
      '/': { title: seo.homeTitle, description: seo.homeDescription, keywords: baseKeywords },
      '/cetuia': {
        title: 'Cetățuia Map | Solaris CET',
        description: 'Interactive hex map for the 9,000 CET village tokens.',
        keywords: `${baseKeywords}, Cetățuia, map, hex grid, token`,
      },
      '/privacy': {
        title: 'Privacy Policy | Solaris CET',
        description: 'Privacy Policy for Solaris CET.',
        keywords: 'Solaris CET privacy policy, GDPR, cookies',
      },
      '/privacy-settings': {
        title: 'Privacy Settings | Solaris CET',
        description: 'Manage cookie consent and privacy settings.',
        keywords: 'Solaris CET cookie preferences, privacy settings',
        noindex: true,
      },
      '/cookie-preferences': {
        title: 'Cookie Preferences | Solaris CET',
        description: 'Manage cookie consent preferences.',
        keywords: 'Solaris CET cookie preferences',
        noindex: true,
      },
      '/privacy-policy': {
        title: 'Privacy Policy | Solaris CET',
        description: 'Privacy Policy for Solaris CET.',
        keywords: 'Solaris CET privacy policy, GDPR, cookies',
      },
      '/terms': {
        title: 'Terms & Conditions | Solaris CET',
        description: 'Terms & Conditions for Solaris CET.',
        keywords: 'Solaris CET terms and conditions',
      },
      '/cookies': {
        title: 'Cookie Policy | Solaris CET',
        description: 'Cookie Policy and consent options for Solaris CET.',
        keywords: 'Solaris CET cookie policy, consent',
      },
      '/risk': {
        title: 'Crypto Risk Disclaimer | Solaris CET',
        description: 'Crypto risk disclaimer for Solaris CET.',
        keywords: 'crypto risk disclaimer, Solaris CET',
      },
      '/transparency': {
        title: 'Transparency Report | Solaris CET',
        description: 'Quarterly transparency report and verification references for Solaris CET.',
        keywords: 'Solaris CET transparency report, verification',
      },
      '/audits': {
        title: 'Security & Audits | Solaris CET',
        description: 'Security posture and audit references for Solaris CET.',
        keywords: 'Solaris CET audit, security, disclosures',
      },
      '/blog': { title: seo.blogTitle, description: seo.blogDescription, keywords: 'Solaris CET blog, announcements, updates' },
      '/demo': { title: seo.demoTitle, description: seo.demoDescription, keywords: 'Solaris CET demo, cinematic, WebGL' },
      '/rwa': { title: seo.rwaTitle, description: seo.rwaDescription, keywords: `${baseKeywords}, real world asset, proof surface` },
      '/cet-ai': { title: seo.cetAiTitle, description: seo.cetAiDescription, keywords: `${baseKeywords}, CET AI, Q&A` },
      '/mining': { title: seo.miningTitle, description: seo.miningDescription, keywords: `${baseKeywords}, mining, staking` },
      '/brand-assets': {
        title: 'Brand Assets | Solaris CET',
        description: 'Download official Solaris CET brand kit, logos, and media assets.',
        keywords: 'Solaris CET logo, brand kit, media assets',
      },
      '/whitepaper': {
        title: 'Whitepaper | Solaris CET',
        description: 'Read and download the Solaris CET whitepaper (multi-language).',
        keywords: 'Solaris CET whitepaper, tokenomics, RWA',
      },
      '/release-notes': {
        title: 'Release Notes | Solaris CET',
        description: 'Version-by-version release notes for Solaris CET.',
        keywords: 'Solaris CET release notes, changelog',
      },
      '/accessibility': {
        title: seo.accessibilityTitle ?? seo.homeTitle,
        description: seo.accessibilityDescription ?? seo.homeDescription,
        keywords: 'Solaris CET accessibility statement, WCAG',
      },
      '/responsible-disclosure': {
        title: seo.responsibleDisclosureTitle,
        description: seo.responsibleDisclosureDescription,
      },
      '/bug-bounty': {
        title: seo.bugBountyTitle,
        description: seo.bugBountyDescription,
      },
      '/faq': {
        title: 'FAQ | Solaris CET',
        description: 'Frequently asked questions about Solaris CET.',
      },
      '/about': {
        title: 'About | Solaris CET',
        description: 'About Solaris CET: timeline, rationale, and verifiable primitives.',
      },
      '/login': {
        title: 'Login | Solaris CET',
        description: 'Login for Solaris CET web app.',
        keywords: 'Solaris CET login, wallet connect',
        noindex: true,
      },
      '/app': {
        title: 'Account | Solaris CET',
        description: 'Solaris CET account area.',
        keywords: 'Solaris CET account, dashboard',
        noindex: true,
      },
      '/admin': {
        title: 'Admin | Solaris CET',
        description: 'Solaris CET admin area.',
        keywords: 'Solaris CET admin',
        noindex: true,
      },
      '/auth': {
        title: 'Auth | Solaris CET',
        description: 'Wallet authentication via TON proof.',
        noindex: true,
      },
      '/wallet': {
        title: 'Wallet | Solaris CET',
        description: 'Wallet dashboard for Solaris CET.',
        noindex: true,
      },
      '/tokenomics': {
        title: 'Tokenomics | Solaris CET',
        description: 'CET tokenomics and distribution charts.',
        keywords: 'Solaris CET tokenomics, CET supply, distribution',
      },
      '/nfts': {
        title: 'NFT Gallery | Solaris CET',
        description: 'Solaris NFT collection gallery and owned NFTs.',
        noindex: true,
      },
      '/airdrop': {
        title: 'Airdrop | Solaris CET',
        description: 'Merkle-based airdrop claim flow.',
        noindex: true,
      },
      '/tx-history': {
        title: 'Transaction History | Solaris CET',
        description: 'TON transaction history with explorer links.',
        noindex: true,
      },
      '/settings': {
        title: 'Settings | Solaris CET',
        description: 'Network and wallet settings.',
        noindex: true,
      },
      '/newsletter/confirm': {
        title: seo.newsletterConfirmTitle,
        description: seo.newsletterConfirmDescription,
        keywords: 'Solaris CET newsletter confirmation',
        noindex: true,
      },
      '/lp/paid': {
        title: 'CET AI Landing | Solaris CET',
        description: 'Paid campaign landing page for Solaris CET.',
        noindex: true,
      },
      '/prelaunch': {
        title: 'Prelaunch | Solaris CET',
        description: 'Pre-launch email signup and lead magnet.',
        noindex: true,
      },
      '/thanks': {
        title: 'Thank you | Solaris CET',
        description: 'Thank you page after signup.',
        noindex: true,
      },
    };

    if (routePath.startsWith('/blog/') && routePath.length > '/blog/'.length) {
      const slug = routePath.slice('/blog/'.length).split('/')[0] ?? '';
      const blogLocale = activeUrlLocale === 'ro' || activeUrlLocale === 'es' ? activeUrlLocale : 'en';
      const post = getBlogPost(blogLocale, slug);
      if (!post) {
        applySpaSeo({
          origin: PRODUCTION_SITE_ORIGIN,
          pathnameNoLocale: routePath,
          locale: activeUrlLocale,
          title: seo.blogTitle,
          description: seo.blogDescription,
          noindex: true,
        });
        return;
      }

      const absoluteUrl = `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/blog/${post.slug}`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/` },
              { '@type': 'ListItem', position: 2, name: seo.blogCrumb ?? 'Blog', item: `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/blog` },
              { '@type': 'ListItem', position: 3, name: post.frontmatter.title, item: absoluteUrl },
            ],
          },
          {
            '@type': 'BlogPosting',
            headline: post.frontmatter.title,
            description: post.frontmatter.description,
            datePublished: post.frontmatter.date,
            inLanguage: activeUrlLocale,
            mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl },
            publisher: { '@id': `${PRODUCTION_SITE_ORIGIN}/#organization` },
            author: { '@type': 'Organization', name: 'Solaris CET' },
          },
        ],
      };

      applySpaSeo({
        origin: PRODUCTION_SITE_ORIGIN,
        pathnameNoLocale: `/blog/${post.slug}`,
        locale: activeUrlLocale,
        title: `${post.frontmatter.title} | Solaris CET`,
        description: post.frontmatter.description,
        keywords: `${baseKeywords}, blog`,
        ogType: 'article',
        jsonLd,
      });
      return;
    }

    if (routePath.startsWith('/c/') && routePath.length > '/c/'.length) {
      const cc = routePath.slice('/c/'.length).split('/')[0] ?? '';
      const countryCode = cc.trim().slice(0, 2).toUpperCase();
      let cn = countryCode || 'Country';
      try {
        const dn = new Intl.DisplayNames([activeUrlLocale], { type: 'region' });
        cn = dn.of(countryCode) || cn;
      } catch {
        void 0;
      }
      applySpaSeo({
        origin: PRODUCTION_SITE_ORIGIN,
        pathnameNoLocale: `/c/${countryCode.toLowerCase()}`,
        locale: activeUrlLocale,
        title: `Solaris CET — ${cn}`,
        description: 'Localized landing page for Solaris CET campaigns.',
      });
      return;
    }

    const meta = routeMeta[routePath];
    if (!meta) {
      applySpaSeo({
        origin: PRODUCTION_SITE_ORIGIN,
        pathnameNoLocale: routePath,
        locale: activeUrlLocale,
        title: seo.homeTitle,
        description: seo.homeDescription,
        noindex: true,
      });
      return;
    }

    const jsonLd =
      routePath === '/blog'
        ? {
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/` },
                  { '@type': 'ListItem', position: 2, name: seo.blogCrumb ?? 'Blog', item: `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/blog` },
                ],
              },
              {
                '@type': 'CollectionPage',
                name: meta.title,
                description: meta.description,
                inLanguage: activeUrlLocale,
                url: `${PRODUCTION_SITE_ORIGIN}/${activeUrlLocale}/blog`,
                publisher: { '@id': `${PRODUCTION_SITE_ORIGIN}/#organization` },
              },
            ],
          }
        : null;

    applySpaSeo({
      origin: PRODUCTION_SITE_ORIGIN,
      pathnameNoLocale: routePath,
      locale: activeUrlLocale,
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      noindex: meta.noindex,
      jsonLd,
    });
  }, [activeUrlLocale, langState.t, routePath]);

  return (
    <RegionContext.Provider value={regionState}>
      <TonNetworkContext.Provider value={tonNetworkState}>
        <JwtSessionContext.Provider value={jwtState}>
          <LanguageContext.Provider value={langState}>
      {/* Loading overlay — blocks interaction with page until warm-up; shell uses inert + aria-hidden */}
      <div
        ref={loadingRef}
        className="loading-overlay"
        aria-busy={!isLoaded}
        aria-hidden={isLoaded}
        aria-live="polite"
      >
        <span className="sr-only" role="status">
          {langState.t.appLoader.brandLine}
          {' — '}
          {langState.t.appLoader.statusLine}
        </span>
        <div className="flex flex-col items-center gap-6" aria-hidden>
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-solaris-gold/[0.08] blur-xl motion-safe:animate-gold-pulse" />
            <div className="relative w-14 h-14 overflow-hidden rounded-2xl bg-slate-950/80 border border-white/[0.08] shadow-[0_0_40px_rgba(242,201,76,0.12)] flex items-center justify-center p-0">
              <SolarisLogoMark
                crop="emblem"
                priority
                className="h-full w-full drop-shadow-[0_0_12px_rgba(242,201,76,0.4)]"
              />
            </div>
          </div>
          
          <div className="text-center">
            <div className="font-display font-semibold text-lg text-solaris-text mb-1">
              Solaris <span className="text-solaris-gold">CET</span>
            </div>
            <div className="hud-label text-[10px]">{langState.t.appLoader.statusLine}</div>
          </div>
          
          <div className="loading-bar-track" aria-hidden>
            <div className="loading-bar-fill" />
          </div>

          <p
            className="max-w-[min(92vw,320px)] text-center text-[9px] font-mono text-fuchsia-200/40 leading-snug line-clamp-2 px-2"
            aria-hidden
          >
            {shortSkillWhisper(skillSeedFromLabel('appLoader|meshWarm'))}
          </p>
        </div>
      </div>

      {!isLhci ? <AnnouncementBanner /> : null}

      {/* Cursor glow effect */}
      {!isLhci ? <CursorGlow /> : null}
      {!isLhci ? <CustomCursor /> : null}
      {!isLhci ? <InteractionEffectsManager /> : null}

      <div
        ref={mainRef}
        className="relative min-h-dvh overflow-x-clip bg-slate-950 text-white/90"
        aria-hidden={!isLoaded}
        inert={!isLoaded ? true : undefined}
      >
        {!isLhci ? <CinematicBackground /> : null}
        {!isLhci ? <RouteSignatureLayer routePath={routePath} /> : null}
        {!isLhci ? <ScrollStoryOverlay routePath={routePath} /> : null}

        {/* Ambient solar glow — fixed, behind sections */}
        <div
          className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute -top-[28%] left-1/2 h-[min(58vh,520px)] w-[min(140vw,960px)] -translate-x-1/2 rounded-full opacity-[0.38] blur-[100px]"
            style={{
              background:
                'radial-gradient(ellipse 75% 65% at 50% 42%, rgba(255,220,165,0.5) 0%, rgba(240,185,70,0.14) 48%, transparent 74%)',
            }}
          />
          <div
            className="absolute top-[12%] right-[4%] h-[min(42vw,400px)] w-[min(42vw,400px)] rounded-full opacity-[0.2] blur-[110px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,205,130,0.55) 0%, rgba(242,180,60,0.08) 50%, transparent 72%)',
            }}
          />
          <div
            className="absolute bottom-[8%] left-[6%] h-[300px] w-[300px] rounded-full opacity-[0.14] blur-[90px]"
            style={{
              background:
                'radial-gradient(circle, rgba(46,231,255,0.4) 0%, transparent 70%)',
            }}
          />
        </div>
        {/* Noise overlay */}
        {!isLhci ? <div className="noise-overlay" /> : null}
        
        <a
          href="#main-content"
          className="skip-to-content"
          onClick={() => {
            const el = document.getElementById('main-content');
            if (!el) return;
            requestAnimationFrame(() => {
              (el as HTMLElement).focus?.();
            });
          }}
        >
          {langState.t.common.skipToMain}
        </a>
        {/* Navigation */}
        {!isLhci ? <Navigation /> : null}
        <Toaster />
        {!isLhci ? <StatusBar /> : null}
        
        <Suspense fallback={null}>
          <RouteTransition key={`${routePath}:${locationKey}`} routeKey={routePath}>
          {routePath === '/audit' ? (
            <NotFoundPage attemptedPath={pathnameRaw} staticRedirectHref="/audit/" />
          ) : routePath.startsWith('/sovereign') || routePath.startsWith('/apocalypse') ? (
            <NotFoundPage attemptedPath={pathnameRaw} staticRedirectHref={pathnameRaw} />
          ) : routePath !== '/' &&
            routePath !== '/privacy' &&
            routePath !== '/privacy-settings' &&
            routePath !== '/cookie-preferences' &&
            routePath !== '/privacy-policy' &&
            routePath !== '/terms' &&
            routePath !== '/cookies' &&
            routePath !== '/risk' &&
            routePath !== '/transparency' &&
            routePath !== '/audits' &&
            routePath !== '/cetuia' &&
            routePath !== '/rwa' &&
            routePath !== '/demo' &&
            routePath !== '/cet-ai' &&
            routePath !== '/mining' &&
            routePath !== '/brand-assets' &&
            routePath !== '/whitepaper' &&
            routePath !== '/blog' &&
            !routePath.startsWith('/blog/') &&
            routePath !== '/release-notes' &&
            routePath !== '/accessibility' &&
            routePath !== '/responsible-disclosure' &&
            routePath !== '/bug-bounty' &&
            routePath !== '/faq' &&
            routePath !== '/about' &&
            routePath !== '/comunitate' &&
            routePath !== '/chat' &&
            routePath !== '/evenimente' &&
            !routePath.startsWith('/evenimente/') &&
            routePath !== '/forum' &&
            !routePath.startsWith('/forum/') &&
            routePath !== '/recompense' &&
            routePath !== '/login' &&
            routePath !== '/auth' &&
            routePath !== '/wallet' &&
            routePath !== '/tokenomics' &&
            routePath !== '/nfts' &&
            routePath !== '/airdrop' &&
            routePath !== '/staking' &&
            routePath !== '/tx-history' &&
            routePath !== '/settings' &&
            routePath !== '/share' &&
            routePath !== '/defi' &&
            routePath !== '/analysis' &&
            routePath !== '/newsletter/confirm' &&
            routePath !== '/newsletter/verify' &&
            routePath !== '/newsletter/unsubscribe' &&
            !routePath.startsWith('/lp/') &&
            !routePath.startsWith('/c/') &&
            routePath !== '/prelaunch' &&
            routePath !== '/thanks' &&
            routePath !== '/app' &&
            routePath !== '/admin' &&
            routePath !== '/docs' &&
            routePath !== '/developers' &&
            routePath !== '/console' &&
            !isLhci ? (
            <NotFoundPage attemptedPath={pathnameRaw} />
          ) : routePath === '/newsletter/confirm' ? (
            <NewsletterConfirmPage />
          ) : routePath === '/blog' ? (
            <ArticlesPage />
          ) : routePath.startsWith('/blog/') ? (
            <ArticlePage slug={routePath.slice('/blog/'.length).split('/')[0] ?? ''} />
          ) : routePath === '/privacy-settings' ? (
            <PrivacySettingsPage />
          ) : routePath === '/cookie-preferences' ? (
            <PrivacySettingsPage />
          ) : routePath === '/privacy' ? (
            <LegalDocPage doc="privacy" />
          ) : routePath === '/privacy-policy' ? (
            <LegalDocPage doc="privacy" />
          ) : routePath === '/terms' ? (
            <LegalDocPage doc="terms" />
          ) : routePath === '/cookies' ? (
            <LegalDocPage doc="cookies" />
          ) : routePath === '/risk' ? (
            <LegalDocPage doc="risk" />
          ) : routePath === '/transparency' ? (
            <LegalDocPage doc="transparency" />
          ) : routePath === '/audits' ? (
            <LegalDocPage doc="audits" />
          ) : routePath === '/mining' ? (
            <HomePage />
          ) : routePath === '/brand-assets' ? (
            <BrandAssetsPage />
          ) : routePath === '/whitepaper' ? (
            <WhitepaperPage />
          ) : routePath === '/release-notes' ? (
            <ReleaseNotesPage />
          ) : routePath === '/accessibility' ? (
            <AccessibilityPage />
          ) : routePath === '/responsible-disclosure' ? (
            <ResponsibleDisclosurePage />
          ) : routePath === '/bug-bounty' ? (
            <BugBountyPage />
          ) : routePath === '/faq' ? (
            <FaqPage />
          ) : routePath === '/about' ? (
            <AboutPage />
          ) : routePath === '/comunitate' ? (
            <CommunityPage />
          ) : routePath === '/chat' ? (
            <ChatPage />
          ) : routePath === '/evenimente' || routePath.startsWith('/evenimente/') ? (
            <EventsPage />
          ) : routePath === '/forum' ? (
            <ForumPage />
          ) : routePath.startsWith('/forum/') ? (
            <ForumPostPage postId={routePath.slice('/forum/'.length).split('/')[0] ?? ''} />
          ) : routePath === '/recompense' ? (
            <RewardsPage />
          ) : routePath === '/auth' ? (
            <AuthPage />
          ) : routePath === '/login' ? (
            <LoginPage />
          ) : routePath === '/wallet' ? (
            <WalletPage />
          ) : routePath === '/profile' ? (
            <ProfilePage />
          ) : routePath.startsWith('/contract') ? (
            <ContractPage />
          ) : routePath === '/tokenomics' ? (
            <TokenomicsPage />
          ) : routePath === '/nfts' ? (
            <NftsPage />
          ) : routePath === '/airdrop' ? (
            <AirdropPage />
          ) : routePath === '/staking' ? (
            <StakingPage />
          ) : routePath === '/tx-history' ? (
            <TxHistoryPage />
          ) : routePath === '/settings' ? (
            <SettingsPage />
          ) : routePath === '/share' ? (
            <ShareTargetPage />
          ) : routePath === '/newsletter/verify' ? (
            <NewsletterVerifyPage />
          ) : routePath === '/newsletter/unsubscribe' ? (
            <NewsletterUnsubscribePage />
          ) : routePath.startsWith('/lp/') ? (
            routePath === '/lp/paid' ? <PaidLandingPage /> : <NotFoundPage attemptedPath={pathnameRaw} />
          ) : routePath === '/prelaunch' ? (
            <PrelaunchPage />
          ) : routePath === '/thanks' ? (
            <ThanksPage />
          ) : routePath === '/app' ? (
            <AccountPage />
          ) : routePath === '/admin' ? (
            <AdminPage />
          ) : routePath === '/docs' ? (
            <DocsPage />
          ) : routePath === '/developers' ? (
            <DevelopersPage />
          ) : routePath === '/console' ? (
            <DeveloperConsolePage />
          ) : routePath === '/cetuia' ? (
            <CetuiaMapPage />
          ) : routePath === '/rwa' ? (
            <RwaPage />
          ) : routePath === '/demo' ? (
            <DemoPage />
          ) : routePath === '/cet-ai' ? (
            <CetAiPage />
          ) : routePath === '/defi' ? (
            <DefiHubPage />
          ) : routePath === '/analysis' ? (
            <TechnicalAnalysisPage />
          ) : isLhci ? (
            <main
              id="main-content"
              className="relative z-10 min-h-[60vh] w-full max-w-4xl mx-auto px-6 py-20 text-center"
            >
              <h1 className="font-display text-4xl md:text-5xl text-white mb-5">
                Solaris <CetSymbol className="text-white" />
              </h1>
              <p className="text-slate-200/90 max-w-2xl mx-auto leading-relaxed">
                AI-native RWA token on TON with fixed 9,000 <CetSymbol className="text-slate-200/90" /> supply and a sovereign proof surface.
              </p>
            </main>
          ) : (
            <HomePage />
          )}
          </RouteTransition>
        </Suspense>
      </div>
      {!isLhci ? <PwaUpdatePrompt /> : null}
      {!isLhci ? <PwaInstallPrompt /> : null}
      {!isLhci && routePath === '/' ? <MobileConversionDock /> : null}
      {!isLhci ? <MobileAppNav routePath={routePath} /> : null}
      {!isLhci ? <BackToTop /> : null}
      <BuildSeal />
      {!isLhci ? <AnalyticsBootstrap routePath={routePath} /> : null}
      {!isLhci ? <MarketingBootstrap routePath={routePath} /> : null}
      <CookieConsentBanner />
          </LanguageContext.Provider>
        </JwtSessionContext.Provider>
      </TonNetworkContext.Provider>
    </RegionContext.Provider>
  );
}

function App() {
  const manifestUrl = import.meta.env.DEV 
    ? `${window.location.origin}/tonconnect-manifest.json`
    : `${PRODUCTION_SITE_ORIGIN}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AppContent />
    </TonConnectUIProvider>
  );
}

export { App };
export default App;
