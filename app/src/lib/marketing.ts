import { type CookieConsentState,onConsentChange, readStoredConsent } from './consent';
import {
  type MarketingPixelsConfig,
  resolveMarketingPixelsConfig,
  trackConversion,
  trackMarketingEvent,
} from './marketingPixels';

let cfg: MarketingPixelsConfig | null = null;
let consent: CookieConsentState | null = null;
let wired = false;

function ensure() {
  if (typeof window === 'undefined') return;
  if (!cfg) cfg = resolveMarketingPixelsConfig();
  if (!consent) consent = readStoredConsent();
  if (wired) return;
  wired = true;
  onConsentChange((next) => {
    consent = next;
  });
}

export function mktEvent(name: string, params?: Record<string, string | number | boolean | null | undefined>) {
  ensure();
  if (!cfg || !consent) return;
  trackMarketingEvent(name, params, consent, cfg);
}

export function mktConversion(name: string, params?: Record<string, string | number | boolean | null | undefined>) {
  ensure();
  if (!cfg || !consent) return;
  trackConversion(name, params, consent, cfg);
}

