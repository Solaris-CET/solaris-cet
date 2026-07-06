import { useEffect, useMemo, useRef } from 'react';

type WebVitalMetric = {
  name: string;
  value: number;
  id: string;
  rating: string;
  delta: number;
  attribution?: {
    interactionTarget?: unknown;
    interactionType?: unknown;
    loadState?: unknown;
    interactionTime?: unknown;
    nextPaintTime?: unknown;
    processedEventEntries?: unknown;
  };
};

import {
  loadAnalyticsScripts,
  resolveAnalyticsConfig,
  trackEvent,
  trackPageView,
  updateConsent,
} from '@/lib/analytics';
import { onConsentChange, readStoredConsent } from '@/lib/consent';

type Props = {
  routePath: string;
};

function addOnceInteractionListener(onFirstInteraction: () => void) {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    cleanup();
    onFirstInteraction();
  };
  const cleanup = () => {
    window.removeEventListener('pointerdown', fire);
    window.removeEventListener('keydown', fire);
    window.removeEventListener('scroll', fire);
  };
  window.addEventListener('pointerdown', fire, { passive: true });
  window.addEventListener('keydown', fire);
  window.addEventListener('scroll', fire, { passive: true });
  return cleanup;
}

export function AnalyticsBootstrap({ routePath }: Props) {
  const cfg = useMemo(() => resolveAnalyticsConfig(), []);
  const interactionRef = useRef(false);
  const consentRef = useRef(readStoredConsent());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raw: string | null | undefined;
    try {
      raw = sessionStorage.getItem('solaris_pending_analytics_event_v1');
    } catch {
      return;
    }
    if (!raw) return;
    if (!consentRef.current.analytics) return;
    try {
      sessionStorage.removeItem('solaris_pending_analytics_event_v1');
    } catch {
      void 0;
    }
    try {
      const rec = JSON.parse(raw) as { name?: unknown; ts?: unknown; key?: unknown; pathname?: unknown };
      const name = typeof rec?.name === 'string' ? rec.name : '';
      if (!name) return;
      trackEvent(name, {
        key: typeof rec?.key === 'string' ? rec.key : null,
        pathname: typeof rec?.pathname === 'string' ? rec.pathname.slice(0, 200) : null,
        ts: typeof rec?.ts === 'number' && Number.isFinite(rec.ts) ? Math.round(rec.ts) : null,
      });
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    if (
      !cfg.ga4MeasurementId &&
      !cfg.gtmContainerId &&
      !cfg.mixpanelToken &&
      !cfg.amplitudeApiKey &&
      !cfg.hotjarSiteId
    )
      return;
    const cleanupInteraction = addOnceInteractionListener(() => {
      interactionRef.current = true;
      void loadAnalyticsScripts(cfg, consentRef.current);
    });
    return cleanupInteraction;
  }, [cfg]);

  useEffect(() => {
    if (
      !cfg.ga4MeasurementId &&
      !cfg.gtmContainerId &&
      !cfg.mixpanelToken &&
      !cfg.amplitudeApiKey &&
      !cfg.hotjarSiteId
    )
      return;
    const off = onConsentChange((next) => {
      consentRef.current = next;
      updateConsent(next);
      if (interactionRef.current) {
        void loadAnalyticsScripts(cfg, next);
      }
    });
    return off;
  }, [cfg]);

  useEffect(() => {
    trackPageView(routePath);
  }, [routePath]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    let loaded = false;

    const send = (m: WebVitalMetric) => {
      if (!consentRef.current.analytics) return;
      const payload: Record<string, string | number | boolean | null | undefined> = {
        metric_name: m.name,
        metric_value: Math.round(m.value * 1000) / 1000,
        metric_id: m.id,
        metric_rating: m.rating,
        metric_delta: Math.round(m.delta * 1000) / 1000,
      };

      if (m.name === 'INP') {
        const a = m.attribution;
        if (a && typeof a === 'object') {
          if (typeof a.interactionType === 'string') payload.inp_interaction_type = a.interactionType;
          if (typeof a.interactionTarget === 'string') payload.inp_interaction_target = a.interactionTarget.slice(0, 500);
          if (typeof a.loadState === 'string') payload.inp_load_state = a.loadState;
          if (typeof a.interactionTime === 'number' && Number.isFinite(a.interactionTime)) payload.inp_interaction_time = Math.round(a.interactionTime);
          if (typeof a.nextPaintTime === 'number' && Number.isFinite(a.nextPaintTime)) payload.inp_next_paint_time = Math.round(a.nextPaintTime);
          if (Array.isArray(a.processedEventEntries)) payload.inp_event_entry_count = a.processedEventEntries.length;
        }
      }

      trackEvent('web_vital', payload);
    };

    const init = async () => {
      if (loaded) return;
      loaded = true;
      try {
        const mod = await import('web-vitals');
        if (cancelled) return;
        mod.onCLS(send);
        mod.onINP(send);
        mod.onLCP(send);
        mod.onFCP(send);
        mod.onTTFB(send);
      } catch {
        void 0;
      }
    };

    const cleanupInteraction = addOnceInteractionListener(() => {
      interactionRef.current = true;
      if (consentRef.current.analytics) void init();
    });

    const off = onConsentChange((next) => {
      consentRef.current = next;
      if (interactionRef.current && next.analytics) void init();
    });

    if (interactionRef.current && consentRef.current.analytics) void init();

    return () => {
      cancelled = true;
      cleanupInteraction();
      off();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onNav = () => trackPageView(window.location.pathname.replace(/\/$/, '') || '/');
    const onPop = () => onNav();
    const onHash = () => onNav();

    const patchHistory = () => {
      const originalPush = history.pushState;
      const originalReplace = history.replaceState;
      history.pushState = function pushState(...args) {
        originalPush.apply(history, args as unknown as Parameters<typeof history.pushState>);
        onNav();
      } as typeof history.pushState;
      history.replaceState = function replaceState(...args) {
        originalReplace.apply(history, args as unknown as Parameters<typeof history.replaceState>);
        onNav();
      } as typeof history.replaceState;
      return () => {
        history.pushState = originalPush;
        history.replaceState = originalReplace;
      };
    };

    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onHash);
    const unpatch = patchHistory();
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onHash);
      unpatch();
    };
  }, []);

  return null;
}
