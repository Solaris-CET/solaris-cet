import { useEffect, useMemo, useRef, useState } from 'react';

import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { onConsentChange, readStoredConsent } from '@/lib/consent';

type Props = {
  handle: string;
  height?: number;
  theme?: 'dark' | 'light';
};

function ensureScript(): void {
  if (document.getElementById('twitter-wjs')) return;
  const s = document.createElement('script');
  s.id = 'twitter-wjs';
  s.src = 'https://platform.twitter.com/widgets.js';
  s.async = true;
  const nonce = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;
  if (nonce) s.setAttribute('nonce', nonce);
  document.body.appendChild(s);
}

export function TwitterTimeline({ handle, height = 620, theme = 'dark' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(() => readStoredConsent().marketing);
  const { lang, t } = useLanguage();
  const ui = t.cookieUi;
  const href = useMemo(() => `https://twitter.com/${handle.replace(/^@/, '')}`, [handle]);

  useEffect(() => {
    return onConsentChange((next) => {
      setEnabled(next.marketing);
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    ensureScript();
    const el = ref.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      const twttr = (window as unknown as { twttr?: { widgets?: { load?: (e?: HTMLElement) => void } } }).twttr;
      const load = twttr?.widgets?.load;
      if (typeof load === 'function') load(el);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [href, enabled]);

  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);
  const settingsHref = localizePathname('/privacy-settings', urlLocale);

  if (!enabled) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="text-white text-sm font-semibold">{ui.externalContentTitle}</div>
        <p className="mt-2 text-white/70 text-sm leading-relaxed">{ui.externalContentBody}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setEnabled(true)}
            className="btn-filled-gold text-xs font-semibold py-2 px-4 rounded-xl"
          >
            {ui.loadExternalContent}
          </button>
          <a
            href={settingsHref}
            className="text-xs font-semibold text-solaris-cyan hover:text-solaris-text underline underline-offset-4"
          >
            {ui.cookieSettings}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full">
      <a
        className="twitter-timeline"
        data-theme={theme}
        data-height={String(height)}
        data-dnt="true"
        href={href}
      >
        Posts by {handle}
      </a>
    </div>
  );
}
