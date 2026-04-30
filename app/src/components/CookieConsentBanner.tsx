import { Cookie,X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { type CookieConsentState,readStoredConsent, writeStoredConsent } from '@/lib/consent';
import { recordConsentProof } from '@/lib/consentProof';

function injectAnalyticsScript(src: string) {
  if (!src) return;
  const id = 'solaris-ux-analytics';
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.async = true;
  s.src = src;
  const nonce = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;
  if (nonce) s.setAttribute('nonce', nonce);
  document.head.appendChild(s);
}

const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentState>(() => {
    return readStoredConsent();
  });
  const { lang, t } = useLanguage();
  const ui = t.cookieUi;

  const analyticsSrc = (import.meta.env.VITE_UX_TEST_SRC ?? '').trim();

  useEffect(() => {
    const consent = readStoredConsent();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hadDecision = Boolean(localStorage.getItem('solaris_cookie_consent'));
    if (!hadDecision) {
      // Animate in after page load to not block LCP
      timer = setTimeout(() => setIsVisible(true), 2500);
    } else {
      if (analyticsSrc && consent.analytics) injectAnalyticsScript(analyticsSrc);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [analyticsSrc]);

  if (!isVisible) return null;

  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);
  const cookiesHref = localizePathname('/cookies', urlLocale);
  const settingsHref = localizePathname('/privacy-settings', urlLocale);

  const handleAcceptAll = () => {
    const consent = writeStoredConsent({ analytics: true, marketing: true });
    void recordConsentProof({ consent, source: 'banner_accept_all', locale: lang });
    if (analyticsSrc) injectAnalyticsScript(analyticsSrc);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consent = writeStoredConsent({ analytics: preferences.analytics, marketing: preferences.marketing });
    void recordConsentProof({ consent, source: 'banner_save', locale: lang });
    if (preferences.analytics && analyticsSrc) injectAnalyticsScript(analyticsSrc);
    setIsVisible(false);
  };

  const handleDecline = () => {
    const consent = writeStoredConsent({ analytics: false, marketing: false });
    void recordConsentProof({ consent, source: 'banner_essential_only', locale: lang });
    setIsVisible(false);
  };

  return (
    <div className="fixed left-4 right-4 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem+var(--mobile-conversion-dock-reserve,0px)))] sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[380px] max-h-[55vh] sm:max-h-[70vh] overflow-y-auto overscroll-contain bg-slate-950/95 backdrop-blur-2xl border border-white/10 p-4 sm:p-5 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500 will-change-transform">
      {!showPreferences ? (
        <>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-solaris-gold/10 border border-solaris-gold/20 flex items-center justify-center shrink-0">
              <Cookie className="w-6 h-6 text-solaris-gold" />
            </div>
            <div className="pt-1">
              <h3 className="font-display font-semibold text-white text-lg leading-none mb-2">
                {ui.bannerTitle}
              </h3>
              <p className="text-sm text-solaris-muted leading-relaxed">
                {ui.bannerBody}{' '}
                <a href={cookiesHref} className="text-solaris-cyan hover:text-solaris-text underline underline-offset-4">
                  {ui.cookiePolicy}
                </a>
                {' · '}
                <a href={settingsHref} className="text-solaris-cyan hover:text-solaris-text underline underline-offset-4">
                  {ui.cookieSettings}
                </a>
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="ml-auto p-1.5 text-solaris-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
              type="button"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleAcceptAll}
              className="w-full btn-filled-gold text-sm font-semibold py-3 rounded-xl transition-transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(242,201,76,0.15)]"
              type="button"
            >
              {ui.acceptAll}
            </button>
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 text-xs font-semibold py-2.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all"
                type="button"
              >
                {ui.customize}
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 text-xs font-semibold py-2.5 px-4 bg-transparent hover:bg-white/5 text-solaris-muted hover:text-white rounded-xl transition-colors"
                type="button"
              >
                {ui.essentialOnly}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
            <h3 className="font-display font-semibold text-solaris-text">
              {ui.preferencesTitle}
            </h3>
            <button 
              onClick={() => setShowPreferences(false)} 
              className="p-1 text-solaris-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/[0.05]">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ui.essentialTitle}</div>
                <div className="text-xs text-solaris-muted leading-relaxed">{ui.essentialBody}</div>
              </div>
              <input type="checkbox" checked disabled className="mt-1 accent-solaris-gold opacity-50 cursor-not-allowed" />
            </div>
            
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl border transition-colors cursor-pointer hover:bg-white/5 border-transparent">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ui.analyticsTitle}</div>
                <div className="text-xs text-solaris-muted leading-relaxed">{ui.analyticsBody}</div>
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
                <div className="text-sm font-semibold text-white mb-1">{ui.marketingTitle}</div>
                <div className="text-xs text-solaris-muted leading-relaxed">{ui.marketingBody}</div>
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
            type="button"
          >
            {ui.saveClose}
          </button>
        </>
      )}
    </div>
  );
};
export default CookieConsentBanner;
