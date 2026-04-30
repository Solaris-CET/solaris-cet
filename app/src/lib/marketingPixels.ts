import type { CookieConsentState } from './consent';

type FbqFn = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

type LintrkFn = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    _linkedin_partner_id?: string;
    _linkedin_data_partner_ids?: string[];
    lintrk?: LintrkFn;
  }
}

type AnyParams = Record<string, string | number | boolean | null | undefined>;

let facebookReady = false;
let linkedinReady = false;
let loadPromise: Promise<void> | null = null;

const queued: Array<{ kind: 'event' | 'conversion'; name: string; params?: AnyParams }> = [];
const MAX_QUEUE = 200;

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
    s.onload = () => {
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => {
      s.remove();
      reject(new Error(`failed to load script: ${src}`));
    };
    document.head.appendChild(s);
  });
}

export type MarketingPixelsConfig = {
  facebookPixelId: string;
  linkedinPartnerId: string;
  linkedinConversionId: string;
  debug: boolean;
};

export function resolveMarketingPixelsConfig(): MarketingPixelsConfig {
  const facebookPixelId = String(import.meta.env.VITE_FACEBOOK_PIXEL_ID ?? '').trim();
  const linkedinPartnerId = String(import.meta.env.VITE_LINKEDIN_PARTNER_ID ?? '').trim();
  const linkedinConversionId = String(import.meta.env.VITE_LINKEDIN_CONVERSION_ID ?? '').trim();
  const debug = String(import.meta.env.VITE_MARKETING_DEBUG ?? '').trim() === '1';
  return { facebookPixelId, linkedinPartnerId, linkedinConversionId, debug };
}

function initFacebookPixel(pixelId: string) {
  if (!pixelId) return;
  if (typeof window.fbq === 'function') return;

  const q: FbqFn = (...args) => {
    q.queue?.push(args);
  };
  q.queue = [];
  q.loaded = true;
  q.version = '2.0';
  q.push = q;

  window.fbq = q;
  window._fbq = q;

  window.fbq('init', pixelId);
}

function initLinkedInPartner(partnerId: string) {
  if (!partnerId) return;
  window._linkedin_partner_id = partnerId;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  if (!window._linkedin_data_partner_ids.includes(partnerId)) {
    window._linkedin_data_partner_ids.push(partnerId);
  }
  if (typeof window.lintrk === 'function') return;
  const q: LintrkFn = (...args) => {
    q.q?.push(args);
  };
  q.q = [];
  window.lintrk = q;
}

function flushQueue(consent: CookieConsentState, cfg: MarketingPixelsConfig) {
  if (!facebookReady && !linkedinReady) return;
  if (!consent.marketing) return;
  while (queued.length) {
    const e = queued.shift();
    if (!e) break;
    if (e.kind === 'event') trackMarketingEvent(e.name, e.params, consent, cfg);
    else trackConversion(e.name, e.params, consent, cfg);
  }
}

export async function loadMarketingPixels(cfg: MarketingPixelsConfig, consent: CookieConsentState): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!consent.marketing) {
    queued.length = 0;
    return;
  }
  if (facebookReady || linkedinReady) {
    flushQueue(consent, cfg);
    return;
  }
  if (!cfg.facebookPixelId && !cfg.linkedinPartnerId) return;
  if (!loadPromise) {
    initFacebookPixel(cfg.facebookPixelId);
    initLinkedInPartner(cfg.linkedinPartnerId);

    const scripts: Promise<void>[] = [];
    if (cfg.facebookPixelId) {
      scripts.push(
        appendScript('https://connect.facebook.net/en_US/fbevents.js').then(() => {
          facebookReady = true;
        }),
      );
    }
    if (cfg.linkedinPartnerId) {
      scripts.push(
        appendScript('https://snap.licdn.com/li.lms-analytics/insight.min.js').then(() => {
          linkedinReady = true;
        }),
      );
    }

    loadPromise = Promise.allSettled(scripts).then(() => {
      void 0;
    })
      .finally(() => {
        loadPromise = null;
      });
  }

  await loadPromise;
  if (!facebookReady && !linkedinReady) return;
  if (cfg.facebookPixelId && facebookReady) window.fbq?.('track', 'PageView');
  flushQueue(consent, cfg);
}

export function trackMarketingEvent(name: string, params?: AnyParams, consent?: CookieConsentState, cfg?: MarketingPixelsConfig) {
  if (typeof window === 'undefined') return;
  if (!cfg || (consent && !consent.marketing)) return;
  if (!cfg.facebookPixelId) return;
  if (!facebookReady) {
    if (consent?.marketing) {
      if (queued.length >= MAX_QUEUE) queued.shift();
      queued.push({ kind: 'event', name, params });
    }
    return;
  }
  if (cfg.facebookPixelId) {
    window.fbq?.('trackCustom', name, params ?? {});
  }
  if (cfg.debug) {
    try {
      console.info('[marketing:event]', name, params ?? {});
    } catch {
      void 0;
    }
  }
}

export function trackConversion(name: string, params?: AnyParams, consent?: CookieConsentState, cfg?: MarketingPixelsConfig) {
  if (typeof window === 'undefined') return;
  if (!cfg || (consent && !consent.marketing)) return;
  const wantsFacebook = Boolean(cfg.facebookPixelId);
  const wantsLinkedIn = Boolean(
    cfg.linkedinPartnerId &&
      cfg.linkedinConversionId &&
      (name === 'Lead' || name === 'CompleteRegistration' || name === 'Subscribe'),
  );
  if (!wantsFacebook && !wantsLinkedIn) return;
  if ((wantsFacebook && !facebookReady) || (wantsLinkedIn && !linkedinReady)) {
    if (consent?.marketing) {
      if (queued.length >= MAX_QUEUE) queued.shift();
      queued.push({ kind: 'conversion', name, params });
    }
    return;
  }

  if (cfg.facebookPixelId && facebookReady) {
    const standard = new Set(['Lead', 'CompleteRegistration', 'Subscribe', 'Purchase']);
    if (standard.has(name)) window.fbq?.('track', name, params ?? {});
    else window.fbq?.('trackCustom', name, params ?? {});
  }

  if (cfg.linkedinPartnerId && cfg.linkedinConversionId && linkedinReady && (name === 'Lead' || name === 'CompleteRegistration' || name === 'Subscribe')) {
    const id = Number(cfg.linkedinConversionId);
    if (Number.isFinite(id) && id > 0) {
      window.lintrk?.('track', { conversion_id: id });
    }
  }

  if (cfg.debug) {
    try {
      console.info('[marketing:conversion]', name, params ?? {});
    } catch {
      void 0;
    }
  }
}
