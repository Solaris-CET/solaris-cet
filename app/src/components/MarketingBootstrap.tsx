import { useEffect, useMemo, useRef } from 'react';

import { onConsentChange, readStoredConsent } from '@/lib/consent';
import { loadMarketingPixels, resolveMarketingPixelsConfig } from '@/lib/marketingPixels';

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

export function MarketingBootstrap({ routePath }: Props) {
  const cfg = useMemo(() => resolveMarketingPixelsConfig(), []);
  const interactionRef = useRef(false);
  const consentRef = useRef(readStoredConsent());

  useEffect(() => {
    if (!cfg.facebookPixelId && !cfg.linkedinPartnerId) return;
    const cleanupInteraction = addOnceInteractionListener(() => {
      interactionRef.current = true;
      void loadMarketingPixels(cfg, consentRef.current);
    });
    return cleanupInteraction;
  }, [cfg]);

  useEffect(() => {
    if (!cfg.facebookPixelId && !cfg.linkedinPartnerId) return;
    const off = onConsentChange((next) => {
      consentRef.current = next;
      if (interactionRef.current) {
        void loadMarketingPixels(cfg, next);
      }
    });
    return off;
  }, [cfg]);

  useEffect(() => {
    if (!routePath) return;
    if (!consentRef.current.marketing) return;
    try {
      if (cfg.facebookPixelId && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
    } catch {
      void 0;
    }
  }, [cfg.facebookPixelId, routePath]);

  return null;
}

