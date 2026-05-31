import { useMemo, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import { type CookieConsentState, readStoredConsent, writeStoredConsent } from '@/lib/consent';

export default function CookieSettingsPage() {
  const { t } = useLanguage();
  const ui = t.cookieUi;
  const [consent, setConsent] = useState<CookieConsentState>(() => readStoredConsent());
  const [info, setInfo] = useState<string | null>(null);

  const summary = useMemo(() => {
    const on = [] as string[];
    if (consent.analytics) on.push(ui.analyticsTitle);
    if (consent.marketing) on.push(ui.marketingTitle);
    return on.length ? on.join(', ') : ui.essentialOnly;
  }, [consent.analytics, consent.marketing, ui.analyticsTitle, ui.essentialOnly, ui.marketingTitle]);

  const save = (next: { analytics: boolean; marketing: boolean }) => {
    const updated = writeStoredConsent(next);
    setConsent(updated);
    setInfo('Preferințele au fost salvate.');
    window.setTimeout(() => setInfo(null), 2500);
  };

  return (
    <main id="main-content" className="min-h-screen pt-24 pb-16 px-5 sm:px-8 xl:px-12 bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{ui.cookieSettings}</h1>
        <p className="mt-4 text-solaris-muted">
          {ui.bannerBody} <span className="text-solaris-text/90 font-semibold">{summary}</span>
        </p>

        {info ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm">
            {info}
          </div>
        ) : null}

        <div className="mt-10 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-solaris-text">{ui.essentialTitle}</div>
            <div className="mt-2 text-sm text-solaris-muted">{ui.essentialBody}</div>
            <div className="mt-3 text-xs text-solaris-muted">Always on</div>
          </div>

          <label className="rounded-2xl border border-white/10 bg-black/30 p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-black/40 transition-colors">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-solaris-text">{ui.analyticsTitle}</span>
              <span className="mt-2 block text-sm text-solaris-muted">{ui.analyticsBody}</span>
            </span>
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) => save({ analytics: e.target.checked, marketing: consent.marketing })}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-solaris-gold"
            />
          </label>

          <label className="rounded-2xl border border-white/10 bg-black/30 p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-black/40 transition-colors">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-solaris-text">{ui.marketingTitle}</span>
              <span className="mt-2 block text-sm text-solaris-muted">{ui.marketingBody}</span>
            </span>
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) => save({ analytics: consent.analytics, marketing: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-solaris-gold"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="btn-filled-gold text-sm px-5 py-3"
              onClick={() => save({ analytics: true, marketing: true })}
            >
              {ui.acceptAll}
            </button>
            <button
              type="button"
              className="btn-outline-white text-sm px-5 py-3"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              {ui.essentialOnly}
            </button>
            <a href="/cookies" className="text-sm text-solaris-cyan hover:text-solaris-text underline underline-offset-4 py-3">
              {ui.cookiePolicy}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
