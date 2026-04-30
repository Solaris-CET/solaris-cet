import { getAuthToken } from './authToken';
import { type CookieConsentState,readStoredConsent } from './consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    mixpanel?: { init?: (token: string, cfg?: Record<string, unknown>) => void; track?: (name: string, props?: Record<string, unknown>) => void };
    amplitude?: {
      getInstance?: () => { init?: (apiKey: string) => void; logEvent?: (name: string, props?: Record<string, unknown>) => void };
      init?: (apiKey: string) => void;
      track?: (name: string, props?: Record<string, unknown>) => void;
    };
    hj?: (...args: unknown[]) => void;
  }
}

type AnyParams = Record<string, string | number | boolean | null | undefined>;

let ready = false;
let loadedGa = false;
let loadedMixpanel = false;
let loadedAmplitude = false;
let loadedHotjar = false;
let lastPageKey = '';
let currentConsent: CookieConsentState | null = null;

const queued: Array<{ name: string; params?: AnyParams }> = [];
const internalQueued: Array<{
  name: string;
  anonId: string;
  sessionId: string;
  ts: number;
  props?: Record<string, unknown>;
  pagePath?: string;
  referrer?: string;
}> = [];

let internalFlushTimer: number | null = null;

function getNonce(): string {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('script[nonce]') as HTMLScriptElement | null;
  return el?.nonce ? String(el.nonce) : '';
}

function appendScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    const nonce = getNonce();
    if (nonce) s.setAttribute('nonce', nonce);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

function appendInlineScript(code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const nonce = getNonce();
    if (nonce) s.setAttribute('nonce', nonce);
    s.text = code;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load inline script'));
    document.head.appendChild(s);
    resolve();
  });
}

function initDataLayer() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

function flushQueue() {
  if (!ready) return;
  while (queued.length) {
    const e = queued.shift();
    if (!e) break;
    window.gtag?.('event', e.name, e.params ?? {});
  }
}

export type AnalyticsConfig = {
  ga4MeasurementId: string;
  gtmContainerId: string;
  mixpanelToken: string;
  amplitudeApiKey: string;
  hotjarSiteId: string;
  hotjarSnippetVersion: string;
  debug: boolean;
};

export function resolveAnalyticsConfig(): AnalyticsConfig {
  const ga4MeasurementId = String(import.meta.env.VITE_GA4_MEASUREMENT_ID ?? '').trim();
  const gtmContainerId = String(import.meta.env.VITE_GTM_CONTAINER_ID ?? '').trim();
  const mixpanelToken = String(import.meta.env.VITE_MIXPANEL_TOKEN ?? '').trim();
  const amplitudeApiKey = String(import.meta.env.VITE_AMPLITUDE_API_KEY ?? '').trim();
  const hotjarSiteId = String(import.meta.env.VITE_HOTJAR_SITE_ID ?? '').trim();
  const hotjarSnippetVersion = String(import.meta.env.VITE_HOTJAR_SNIPPET_VERSION ?? '').trim() || '6';
  const debug = String(import.meta.env.VITE_ANALYTICS_DEBUG ?? '').trim() === '1';
  return {
    ga4MeasurementId,
    gtmContainerId,
    mixpanelToken,
    amplitudeApiKey,
    hotjarSiteId,
    hotjarSnippetVersion,
    debug,
  };
}

export async function loadAnalyticsScripts(cfg: AnalyticsConfig, consent: CookieConsentState): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!consent.analytics) return;
  currentConsent = consent;
  const gaId = cfg.ga4MeasurementId;
  const gtmId = cfg.gtmContainerId;

  if (!loadedGa && (gaId || gtmId)) {
    loadedGa = true;
    initDataLayer();
    window.gtag?.('js', new Date());
    window.gtag?.('consent', 'default', {
      analytics_storage: consent.analytics ? 'granted' : 'denied',
      ad_storage: consent.marketing ? 'granted' : 'denied',
      ad_user_data: consent.marketing ? 'granted' : 'denied',
      ad_personalization: consent.marketing ? 'granted' : 'denied',
      wait_for_update: 500,
    });

    if (gaId) {
      await appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
      window.gtag?.('config', gaId, {
        anonymize_ip: true,
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    if (gtmId) {
      (window.dataLayer as unknown[]).push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      await appendScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
    }

    ready = true;
    flushQueue();
  }

  if (!loadedMixpanel && cfg.mixpanelToken) {
    loadedMixpanel = true;
    await appendScript('https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js');
    window.mixpanel?.init?.(cfg.mixpanelToken, { debug: cfg.debug });
  }

  if (!loadedAmplitude && cfg.amplitudeApiKey) {
    loadedAmplitude = true;
    await appendScript('https://cdn.amplitude.com/libs/amplitude-8.17.0-min.gz.js');
    const inst = window.amplitude?.getInstance?.();
    if (inst?.init) inst.init(cfg.amplitudeApiKey);
    else if (window.amplitude?.init) window.amplitude.init(cfg.amplitudeApiKey);
  }

  if (!loadedHotjar && cfg.hotjarSiteId) {
    const id = Number.parseInt(cfg.hotjarSiteId, 10);
    const sv = Number.parseInt(cfg.hotjarSnippetVersion, 10);
    if (Number.isFinite(id) && id > 0 && Number.isFinite(sv) && sv > 0) {
      loadedHotjar = true;
      await appendInlineScript(
        `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${id},hjsv:${sv}};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;var n='${getNonce()}';if(n)r.setAttribute('nonce',n);a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
      );
    }
  }
}

export function updateConsent(consent: CookieConsentState) {
  if (typeof window === 'undefined') return;
  currentConsent = consent;
  window.gtag?.('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.marketing ? 'granted' : 'denied',
  });
}

export function trackEvent(name: string, params?: AnyParams) {
  if (typeof window === 'undefined') return;
  const consent = currentConsent ?? readStoredConsent();
  currentConsent = consent;
  if (!consent.analytics) return;
  try {
    flushInternalMaybe(name, params);
  } catch {
    void 0;
  }
  if (!ready) {
    queued.push({ name, params });
  } else {
    window.gtag?.('event', name, params ?? {});
  }
  try {
    const props = params ? (params as Record<string, unknown>) : undefined;
    window.mixpanel?.track?.(name, props);
    const inst = window.amplitude?.getInstance?.();
    if (inst?.logEvent) inst.logEvent(name, props);
    else if (window.amplitude?.track) window.amplitude.track(name, props);
  } catch {
    void 0;
  }
}

export function trackPageView(pathname: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const key = `${pathname}|${url.search}|${url.hash}`;
  if (key === lastPageKey) return;
  lastPageKey = key;
  trackEvent('page_view', {
    page_location: url.toString(),
    page_path: `${url.pathname}${url.search}${url.hash}`,
    page_title: document.title,
  });
}

export function trackAiQuery(input: { topic?: string; queryLength: number; route?: string; source?: string }) {
  trackEvent('ai_query', {
    topic: input.topic ?? null,
    query_length: input.queryLength,
    route: input.route ?? null,
    source: input.source ?? null,
  });
}

export function trackWalletConnect(input: { network?: string; source?: string }) {
  trackEvent('wallet_connect', {
    network: input.network ?? null,
    source: input.source ?? null,
  });
}

export function trackBuyClick(input: { destination: string; source?: string }) {
  trackEvent('buy_click', {
    destination: input.destination,
    source: input.source ?? null,
  });
  trackEvent('conversion_click', {
    conversion_type: 'buy',
    destination: input.destination,
    source: input.source ?? null,
  });
}

export function trackSocialClick(input: { platform: string; destination: string; source?: string }) {
  trackEvent('social_click', {
    platform: input.platform,
    destination: input.destination,
    source: input.source ?? null,
  });
  trackEvent('conversion_click', {
    conversion_type: 'social',
    platform: input.platform,
    destination: input.destination,
    source: input.source ?? null,
  });
}

export function trackWhitepaperClick(input: { destination: string; source?: string; lang?: string }) {
  trackEvent('whitepaper_click', {
    destination: input.destination,
    source: input.source ?? null,
    lang: input.lang ?? null,
  });
  trackEvent('conversion_click', {
    conversion_type: 'whitepaper',
    destination: input.destination,
    source: input.source ?? null,
    lang: input.lang ?? null,
  });
}

function randomId(): string {
  try {
    const anyCrypto = crypto as unknown as { randomUUID?: () => string };
    if (typeof anyCrypto.randomUUID === 'function') return anyCrypto.randomUUID();
  } catch {
    void 0;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAnonId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const k = 'solaris_analytics_anon_id';
    const existing = localStorage.getItem(k);
    if (existing && existing.trim()) return existing.trim().slice(0, 120);
    const created = randomId();
    localStorage.setItem(k, created);
    return created;
  } catch {
    return randomId();
  }
}

function getSessionId(nowMs: number): string {
  if (typeof window === 'undefined') return 'server';
  const ttlMs = 30 * 60 * 1000;
  try {
    const idKey = 'solaris_analytics_session_id';
    const lastKey = 'solaris_analytics_session_last';
    const last = Number.parseInt(localStorage.getItem(lastKey) ?? '', 10);
    const existing = localStorage.getItem(idKey);
    if (existing && Number.isFinite(last) && nowMs - last < ttlMs) {
      localStorage.setItem(lastKey, String(nowMs));
      return existing.trim().slice(0, 140);
    }
    const created = `${getAnonId()}.${nowMs.toString(36)}.${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(idKey, created);
    localStorage.setItem(lastKey, String(nowMs));
    return created.slice(0, 140);
  } catch {
    return `${getAnonId()}.${nowMs.toString(36)}.${Math.random().toString(36).slice(2, 8)}`.slice(0, 140);
  }
}

function flushInternalMaybe(name: string, params?: AnyParams) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const url = new URL(window.location.href);
  internalQueued.push({
    name,
    anonId: getAnonId(),
    sessionId: getSessionId(now),
    ts: now,
    props: params ? (params as Record<string, unknown>) : undefined,
    pagePath: `${url.pathname}${url.search}${url.hash}`.slice(0, 500),
    referrer: (document.referrer || '').slice(0, 800),
  });
  if (internalQueued.length >= 20) {
    void flushInternal();
    return;
  }
  if (internalFlushTimer != null) return;
  internalFlushTimer = window.setTimeout(() => {
    internalFlushTimer = null;
    void flushInternal();
  }, 600);
}

async function flushInternal(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (internalQueued.length === 0) return;
  const batch = internalQueued.splice(0, 50);
  const payload = JSON.stringify({ events: batch });
  const token = getAuthToken();
  if (token) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: payload,
      keepalive: true,
    }).catch(() => {});
    return;
  }
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
      return;
    }
  } catch {
    void 0;
  }
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
