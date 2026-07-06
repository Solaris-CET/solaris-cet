import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AnalyticsConfig,loadAnalyticsScripts, trackBuyClick, trackSocialClick, trackWhitepaperClick } from '@/lib/analytics';
import type { CookieConsentState } from '@/lib/consent';

function consentState(partial?: Partial<CookieConsentState>): CookieConsentState {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    ...(partial ?? {}),
  };
}

function stubScriptLoads() {
  const spy = vi.spyOn(document.head, 'appendChild');
  spy.mockImplementation((node: Node) => {
    const el = node as unknown as { tagName?: string; onload?: ((e: Event) => void) | null };
    if (el.tagName === 'SCRIPT' && typeof el.onload === 'function') {
      el.onload(new Event('load'));
    }
    return node;
  });
  return () => spy.mockRestore();
}

describe('analytics consent gating', () => {
  beforeEach(() => {
    localStorage.clear();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = undefined;
    (window as unknown as { gtag?: unknown }).gtag = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not emit events when analytics consent is denied', () => {
    localStorage.setItem(
      'solaris_cookie_consent',
      JSON.stringify(consentState({ analytics: false, marketing: false })),
    );
    const gtag = vi.fn();
    (window as unknown as { gtag?: unknown }).gtag = gtag;

    trackBuyClick({ destination: 'https://example.com', source: 'test' });
    trackSocialClick({ platform: 'telegram', destination: 'https://t.me/example', source: 'test' });
    trackWhitepaperClick({ destination: 'https://example.com/wp.pdf', source: 'test', lang: 'ro' });

    expect(gtag).not.toHaveBeenCalled();
  });

  it('emits conversion events after analytics scripts are loaded and consent is granted', async () => {
    localStorage.setItem(
      'solaris_cookie_consent',
      JSON.stringify(consentState({ analytics: true, marketing: false })),
    );
    const restore = stubScriptLoads();
    const cfg: AnalyticsConfig = {
      ga4MeasurementId: '',
      gtmContainerId: 'GTM-TEST',
      mixpanelToken: '',
      amplitudeApiKey: '',
      hotjarSiteId: '',
      hotjarSnippetVersion: '6',
      debug: false,
    };

    await loadAnalyticsScripts(cfg, consentState({ analytics: true, marketing: false }));

    trackBuyClick({ destination: 'https://dedust.io/pools/test', source: 'unit' });
    trackSocialClick({ platform: 'x', destination: 'https://twitter.com/solaris', source: 'unit' });
    trackWhitepaperClick({ destination: 'https://dweb.link/ipfs/test', source: 'unit', lang: 'en' });

    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];
    const events = dl.filter((e) => Array.isArray(e) && e[0] === 'event') as unknown[][];

    expect(events.some((e) => e[1] === 'buy_click')).toBe(true);
    expect(events.some((e) => e[1] === 'social_click')).toBe(true);
    expect(events.some((e) => e[1] === 'whitepaper_click')).toBe(true);
    expect(events.some((e) => e[1] === 'conversion_click')).toBe(true);

    restore();
  });
});

