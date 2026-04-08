import React, { useEffect, useState } from 'react';
import { X, Cookie } from 'lucide-react';

type CookieConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

function readStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('solaris_cookie_consent');
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    return {
      essential: true,
      analytics: Boolean(obj.analytics),
      marketing: Boolean(obj.marketing),
    };
  } catch {
    return null;
  }
}

function injectAnalyticsScript(src: string) {
  if (!src) return;
  const id = 'solaris-ux-analytics';
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentState>(() => {
    return readStoredConsent() ?? { essential: true, analytics: false, marketing: false };
  });

  const analyticsSrc = (import.meta.env.VITE_UX_TEST_SRC ?? '').trim();

  useEffect(() => {
    const consent = readStoredConsent();
    let timer: NodeJS.Timeout;
    if (!consent) {
      // Animate in after page load to not block LCP
      timer = setTimeout(() => setIsVisible(true), 2500);
    } else {
      if (analyticsSrc && consent.analytics) injectAnalyticsScript(analyticsSrc);
    }
    return () => clearTimeout(timer);
  }, [analyticsSrc]);

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    localStorage.setItem(
      'solaris_cookie_consent',
      JSON.stringify({ essential: true, analytics: true, marketing: true })
    );
    if (analyticsSrc) injectAnalyticsScript(analyticsSrc);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      'solaris_cookie_consent',
      JSON.stringify(preferences)
    );
    if (preferences.analytics && analyticsSrc) injectAnalyticsScript(analyticsSrc);
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      'solaris_cookie_consent',
      JSON.stringify({ essential: true, analytics: false, marketing: false })
    );
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-slate-950/95 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500 will-change-transform">
      {!showPreferences ? (
        <>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center shrink-0">
              <Cookie className="w-6 h-6 text-solaris-gold" />
            </div>
            <div className="pt-1">
              <h3 className="font-display font-semibold text-white text-lg leading-none mb-2">
                GDPR &amp; Cookies
              </h3>
              <p className="text-sm text-solaris-muted leading-relaxed">
                Utilizăm module cookie pentru funcționarea platformei, analizarea traficului și îmbunătățirea experienței. Alegerea îți aparține.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleAcceptAll}
              className="w-full btn-filled-gold text-sm font-semibold py-3 rounded-xl transition-transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(242,201,76,0.15)]"
            >
              Acceptă Toate Cookies
            </button>
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 text-xs font-semibold py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all"
              >
                Setări Personalizate
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 text-xs font-semibold py-2.5 px-4 bg-transparent hover:bg-white/5 text-solaris-muted hover:text-white rounded-xl transition-colors"
              >
                Doar Esențiale
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h3 className="font-display font-semibold text-solaris-text">
              Configurează Preferințele
            </h3>
            <button 
              onClick={() => setShowPreferences(false)} 
              className="p-1 text-solaris-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/[0.05]">
              <div>
                <div className="text-sm font-semibold text-white mb-1">Strict Necesare (Esențiale)</div>
                <div className="text-xs text-solaris-muted leading-relaxed">Necesare funcționării normale (sesiuni, gateway-ul web3, securitate). Nu le poți dezactiva.</div>
              </div>
              <input type="checkbox" checked disabled className="mt-1 accent-solaris-gold opacity-50 cursor-not-allowed" />
            </div>
            
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl border transition-colors cursor-pointer hover:bg-white/5 border-transparent">
              <div>
                <div className="text-sm font-semibold text-white mb-1">Analitice & Performanță</div>
                <div className="text-xs text-solaris-muted leading-relaxed">Ne ajută anonim să îmbunătățim experiența utilizatorilor colectând date despre interacțiuni.</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-solaris-gold border-white/20 focus:ring-solaris-gold focus:ring-offset-0 bg-transparent cursor-pointer"
              />
            </label>
            
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl border transition-colors cursor-pointer hover:bg-white/5 border-transparent">
              <div>
                <div className="text-sm font-semibold text-white mb-1">Marketing și Retargeting</div>
                <div className="text-xs text-solaris-muted leading-relaxed">Folosite pentru a eficientiza bugetele de achiziție de investitori (Facebook/X Pixel).</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-solaris-gold border-white/20 focus:ring-solaris-gold focus:ring-offset-0 bg-transparent cursor-pointer"
              />
            </label>
          </div>
          
          <button
            onClick={handleSavePreferences}
            className="w-full btn-filled-gold text-sm font-semibold py-3 rounded-xl transition-transform hover:-translate-y-0.5"
          >
            Salvează și Închide
          </button>
        </>
      )}
    </div>
  );
};
export default CookieConsentBanner;
