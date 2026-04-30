import { useEffect, useMemo, useState } from 'react';

import { useJwtSession } from '@/hooks/useJwtSession';
import { useLanguage } from '@/hooks/useLanguage';
import { localizePathname, parseUrlLocaleFromPathname, urlLocaleFromLang } from '@/i18n/urlRouting';
import { type CookieConsentState,readStoredConsent, writeStoredConsent } from '@/lib/consent';
import { recordConsentProof } from '@/lib/consentProof';

export default function PrivacySettingsPage() {
  const { token, setToken, isAuthenticated } = useJwtSession();
  const { lang, t } = useLanguage();
  const ui = t.cookieUi;
  const [consent, setConsent] = useState<CookieConsentState>(() => readStoredConsent());
  const [saveInfo, setSaveInfo] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportInfo, setExportInfo] = useState<string | null>(null);
  const [dsarType, setDsarType] = useState<'access' | 'portability' | 'delete' | 'rectification' | 'other'>('access');
  const [dsarEmail, setDsarEmail] = useState('');
  const [dsarWallet, setDsarWallet] = useState('');
  const [dsarMessage, setDsarMessage] = useState('');
  const [dsarBusy, setDsarBusy] = useState(false);
  const [dsarInfo, setDsarInfo] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deleteInfo, setDeleteInfo] = useState<string | null>(null);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : null), [token]);

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const urlLocale =
    typeof window === 'undefined'
      ? urlLocaleFromLang(lang)
      : parseUrlLocaleFromPathname(window.location.pathname).locale ?? urlLocaleFromLang(lang);
  const cookiesHref = localizePathname('/cookies', urlLocale);
  const privacyPolicyHref = localizePathname('/privacy', urlLocale);
  const termsHref = localizePathname('/terms', urlLocale);
  const riskHref = localizePathname('/risk', urlLocale);
  const loginHref = localizePathname('/login', urlLocale);

  const save = async (next: { analytics: boolean; marketing: boolean }, source: string) => {
    const updated = writeStoredConsent(next);
    setConsent(updated);
    setSaveInfo('Preferințele au fost salvate.');
    void recordConsentProof({ consent: updated, source, locale: lang, token });
  };

  const exportData = async () => {
    if (!authHeaders) return;
    setExportBusy(true);
    setExportInfo(null);
    try {
      const res = await fetch('/api/gdpr/export', { method: 'GET', headers: authHeaders });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setExportInfo(json.error ? String(json.error).slice(0, 200) : 'Nu am putut exporta datele.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/i)?.[1] ?? 'solaris-cet-data-export.json';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportInfo('Descărcarea a pornit.');
    } catch {
      setExportInfo('Nu am putut exporta datele.');
    } finally {
      setExportBusy(false);
    }
  };

  const submitDsar = async () => {
    setDsarBusy(true);
    setDsarInfo(null);
    try {
      const payload = {
        type: dsarType,
        email: dsarEmail.trim() || null,
        walletAddress: dsarWallet.trim() || null,
        message: dsarMessage.trim(),
        locale: lang,
        pageUrl: typeof window === 'undefined' ? null : window.location.href,
      };
      const res = await fetch('/api/gdpr/dsar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders ?? {}) },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; conversationId?: string; error?: string };
      if (res.ok && json.ok) {
        setDsarInfo('Cererea a fost trimisă.');
        setDsarMessage('');
      } else {
        setDsarInfo(json.error ? String(json.error).slice(0, 200) : 'Nu am putut trimite cererea.');
      }
    } catch {
      setDsarInfo('Nu am putut trimite cererea.');
    } finally {
      setDsarBusy(false);
    }
  };

  const requestDelete = async () => {
    if (!authHeaders) return;
    if (deleteStep === 'idle') {
      setDeleteStep('confirm');
      setDeleteInfo('Confirmă încă o dată pentru a șterge contul și datele asociate.');
      return;
    }
    setDeleteBusy(true);
    setDeleteInfo(null);
    try {
      const res = await fetch('/api/gdpr', { method: 'DELETE', headers: authHeaders });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (res.ok && json.success) {
        setToken(null);
        setDeleteInfo('Cererea a fost procesată. Datele au fost șterse.');
      } else {
        setDeleteInfo(json.error ? String(json.error).slice(0, 200) : 'Nu am putut procesa cererea.');
      }
    } catch {
      setDeleteInfo('Nu am putut procesa cererea.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <header className="rounded-2xl border border-white/10 bg-black/30 p-6">
          <h1 className="text-white text-2xl font-semibold tracking-tight">Setări confidențialitate</h1>
          <p className="mt-2 text-white/60 text-sm">
            Controlează consimțământul pentru cookie-uri și gestionează cererile GDPR.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href={cookiesHref} className="text-solaris-cyan hover:text-white transition-colors">{ui.cookiePolicy}</a>
            <a href={privacyPolicyHref} className="text-solaris-cyan hover:text-white transition-colors">{t.footerNav.privacy}</a>
            <a href={termsHref} className="text-solaris-cyan hover:text-white transition-colors">{t.footerNav.terms}</a>
            <a href={riskHref} className="text-solaris-cyan hover:text-white transition-colors">Risk</a>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <h2 className="text-white text-lg font-semibold">{ui.cookiePolicy}</h2>
          <p className="mt-2 text-white/60 text-sm">Cookie-urile strict necesare sunt active permanent.</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/[0.06]">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ui.essentialTitle}</div>
                <div className="text-xs text-white/60 leading-relaxed">{ui.essentialBody}</div>
              </div>
              <input type="checkbox" checked disabled className="mt-1 accent-solaris-gold opacity-50 cursor-not-allowed" />
            </div>

            <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-transparent hover:bg-white/5 transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ui.analyticsTitle}</div>
                <div className="text-xs text-white/60 leading-relaxed">{ui.analyticsBody}</div>
              </div>
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent((prev) => ({ ...prev, analytics: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-solaris-gold border-white/20 focus:ring-solaris-gold focus:ring-offset-0 bg-transparent cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3 rounded-xl border border-transparent hover:bg-white/5 transition-colors cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ui.marketingTitle}</div>
                <div className="text-xs text-white/60 leading-relaxed">{ui.marketingBody}</div>
              </div>
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent((prev) => ({ ...prev, marketing: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-solaris-gold border-white/20 focus:ring-solaris-gold focus:ring-offset-0 bg-transparent cursor-pointer"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save({ analytics: consent.analytics, marketing: consent.marketing }, 'privacy_save')}
              className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold"
            >
              Salvează
            </button>
            <button
              type="button"
              onClick={() => void save({ analytics: false, marketing: false }, 'privacy_essential_only')}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              {ui.essentialOnly}
            </button>
          </div>
          {saveInfo ? <div className="mt-3 text-xs text-white/60">{saveInfo}</div> : null}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <h2 className="text-white text-lg font-semibold">GDPR</h2>
          <p className="mt-2 text-white/60 text-sm">
            Poți cere acces/portabilitate (export) și ștergerea datelor personale asociate contului tău.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void exportData()}
              disabled={!isAuthenticated || exportBusy}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
            >
              Export date (JSON)
            </button>
          </div>
          {exportInfo ? <div className="mt-3 text-xs text-white/60">{exportInfo}</div> : null}

          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-white font-semibold">DSAR (Data Subject Access Request)</div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-white/70">
                Tip cerere
                <select
                  value={dsarType}
                  onChange={(e) => setDsarType(e.target.value as typeof dsarType)}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                >
                  <option value="access">Acces</option>
                  <option value="portability">Portabilitate</option>
                  <option value="rectification">Rectificare</option>
                  <option value="delete">Ștergere</option>
                  <option value="other">Altele</option>
                </select>
              </label>
              <label className="text-sm text-white/70">
                Email
                <input
                  value={dsarEmail}
                  onChange={(e) => setDsarEmail(e.target.value)}
                  placeholder="tu@exemplu.com"
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/70 sm:col-span-2">
                Wallet (opțional)
                <input
                  value={dsarWallet}
                  onChange={(e) => setDsarWallet(e.target.value)}
                  placeholder="Adresa wallet TON"
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                />
              </label>
              <label className="text-sm text-white/70 sm:col-span-2">
                Mesaj
                <textarea
                  value={dsarMessage}
                  onChange={(e) => setDsarMessage(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void submitDsar()}
                disabled={dsarBusy}
                className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold disabled:opacity-60"
              >
                Trimite cererea
              </button>
            </div>
            {dsarInfo ? <div className="mt-3 text-xs text-white/60">{dsarInfo}</div> : null}
          </div>

          {!isAuthenticated ? (
            <div className="mt-5 text-sm text-white/70">
              Conectează-te ca să poți trimite o cerere de ștergere.
              <div className="mt-3">
                <a href={loginHref} className="text-solaris-cyan hover:text-white transition-colors">Login</a>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => void requestDelete()}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
              >
                {deleteStep === 'idle' ? 'Șterge contul și datele' : 'Confirmă ștergerea'}
              </button>
              {deleteInfo ? <div className="mt-3 text-xs text-white/60">{deleteInfo}</div> : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
