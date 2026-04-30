import { useEffect, useMemo, useRef } from 'react';
import { type Metric,onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

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
    const send = (m: Metric) => {
      if (!consentRef.current.analytics) return;
      trackEvent('web_vital', {
        metric_name: m.name,
        metric_value: Math.round(m.value * 1000) / 1000,
        metric_id: m.id,
        metric_rating: m.rating,
        metric_delta: Math.round(m.delta * 1000) / 1000,
      });
    };

    onCLS(send);
    onINP(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
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
