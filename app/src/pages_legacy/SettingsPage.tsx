import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import WalletConnect from '@/components/WalletConnect';
import { useDataSaver } from '@/hooks/useDataSaver';
import { useJwtSession } from '@/hooks/useJwtSession';
import { type LangCode,SUPPORTED_LANGS, useLanguage } from '@/hooks/useLanguage';

type MfaStatus = { enabled: boolean; pending: boolean };
type SessionsPayload = {
  currentSessionId: string | null;
  mfaEnabled: boolean;
  sessions: Array<{
    id: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string;
    revokedAt: string | null;
    ip: string | null;
    userAgent: string | null;
    active: boolean;
    current: boolean;
  }>;
};

type TelegramWidgetUser = Record<string, unknown>;

type UserWallet = { address: string; label: string | null; isPrimary: boolean };

export default function SettingsPage() {
  const { token, isAuthenticated, setToken } = useJwtSession();
  const { enabled: dataSaver, setEnabled: setDataSaver } = useDataSaver();
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mfa, setMfa] = useState<MfaStatus>({ enabled: false, pending: false });
  const [setupSecret, setSetupSecret] = useState<{ secretBase32: string; otpauthUrl: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [sessions, setSessions] = useState<SessionsPayload | null>(null);
  const [sessionMfaCode, setSessionMfaCode] = useState('');

  const [prefLang, setPrefLang] = useState<LangCode>(lang);
  const [prefTheme, setPrefTheme] = useState(theme ?? 'dark');

  const telegramBotUsername = useMemo(() => String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? '').trim(), []);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkInfo, setLinkInfo] = useState<string | null>(null);
  const [telegramWidgetEnabled, setTelegramWidgetEnabled] = useState(false);

  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [walletLabel, setWalletLabel] = useState('');
  const [walletSetPrimary, setWalletSetPrimary] = useState(false);

  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineInfo, setOfflineInfo] = useState<string | null>(null);
  const [offlineCacheStatus, setOfflineCacheStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramBotUsername) return;
    if (!telegramWidgetEnabled) return;
    const container = document.getElementById('telegram-link');
    if (!container) return;
    container.replaceChildren();
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.setAttribute('data-telegram-login', telegramBotUsername);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-onauth', 'onTelegramLinkAuth(user)');
    s.setAttribute('data-request-access', 'write');
    container.appendChild(s);
  }, [telegramBotUsername, telegramWidgetEnabled]);

  useEffect(() => {
    if (!token) return;
    (window as unknown as { onTelegramLinkAuth?: (u: TelegramWidgetUser) => void }).onTelegramLinkAuth = async (u) => {
      setLinkInfo(null);
      try {
        const res = await fetch('/api/auth/telegram/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(u),
        });
        const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
        if (!res.ok || !json?.ok) {
          setLinkInfo(typeof json?.error === 'string' ? json.error : 'Telegram link failed');
          return;
        }
        setLinkInfo('Telegram login linked.');
      } catch (e) {
        setLinkInfo(String(e instanceof Error ? e.message : e).slice(0, 160));
      }
    };
  }, [token]);

  const linkGithub = async () => {
    if (!authHeaders) return;
    setLinkBusy(true);
    setLinkInfo(null);
    try {
      const res = await fetch('/api/auth/oauth/github/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ returnTo: '/settings' }),
      });
      const json = (await res.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      const u = typeof json?.url === 'string' ? json.url : '';
      if (!res.ok || !u) {
        setLinkInfo(typeof json?.error === 'string' ? json.error : 'GitHub link unavailable');
        return;
      }
      window.location.assign(u);
    } catch (e) {
      setLinkInfo(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setLinkBusy(false);
    }
  };

  const loadAll = useCallback(async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const [mfaRes, sRes, wRes] = await Promise.all([
        fetch('/api/security/mfa', { headers: authHeaders, cache: 'no-store' }),
        fetch('/api/security/sessions', { headers: authHeaders, cache: 'no-store' }),
        fetch('/api/wallets', { headers: authHeaders, cache: 'no-store' }),
      ]);
      const mfaJson = (await mfaRes.json().catch(() => null)) as { ok?: boolean; enabled?: unknown; pending?: unknown } | null;
      const sJson = (await sRes.json().catch(() => null)) as ({ ok?: boolean } & SessionsPayload) | null;
      if (mfaRes.ok && mfaJson?.ok) {
        setMfa({ enabled: Boolean(mfaJson.enabled), pending: Boolean(mfaJson.pending) });
      }
      if (sRes.ok && sJson?.ok) {
        setSessions(sJson);
      }

      const wJson = (await wRes.json().catch(() => null)) as { ok?: boolean; wallets?: unknown } | null;
      if (wRes.ok && wJson?.ok && Array.isArray(wJson.wallets)) {
        setWallets(
          (wJson.wallets as Array<{ address?: unknown; label?: unknown; isPrimary?: unknown }>).map((w) => ({
            address: typeof w.address === 'string' ? w.address : '',
            label: typeof w.label === 'string' ? w.label : null,
            isPrimary: Boolean(w.isPrimary),
          }))
          .filter((w) => Boolean(w.address)),
        );
      }

      const meRes = await fetch('/api/me', { headers: authHeaders, cache: 'no-store' });
      const meJson = (await meRes.json().catch(() => null)) as
        | { settings?: { locale?: unknown; theme?: unknown } }
        | null;
      if (meRes.ok) {
        const locale = typeof meJson?.settings?.locale === 'string' ? meJson.settings.locale : '';
        const t = typeof meJson?.settings?.theme === 'string' ? meJson.settings.theme : '';
        if (locale && (SUPPORTED_LANGS as readonly string[]).includes(locale)) {
          setPrefLang(locale as LangCode);
          setLang(locale as LangCode);
        }
        if (t && ['dark', 'light', 'system'].includes(t)) {
          setPrefTheme(t);
          setTheme(t);
        }
      }
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e).slice(0, 200));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, setLang, setTheme]);

  const linkTwitter = async () => {
    if (!authHeaders) return;
    setLinkBusy(true);
    setLinkInfo(null);
    try {
      const res = await fetch('/api/auth/oauth/twitter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ returnTo: '/settings' }),
      });
      const json = (await res.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      const u = typeof json?.url === 'string' ? json.url : '';
      if (!res.ok || !u) {
        setLinkInfo(typeof json?.error === 'string' ? json.error : 'Twitter link unavailable');
        return;
      }
      window.location.assign(u);
    } catch (e) {
      setLinkInfo(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setLinkBusy(false);
    }
  };

  const unlinkWallet = async (address: string) => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallets?address=${encodeURIComponent(address)}`, { method: 'DELETE', headers: authHeaders });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to unlink wallet');
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const clearOfflineCache = async () => {
    setOfflineBusy(true);
    setOfflineInfo(null);
    try {
      if (!('serviceWorker' in navigator)) {
        setOfflineInfo('Service worker not supported in this browser.');
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration('/');
      const swc = navigator.serviceWorker.controller;
      const target = swc || reg?.active || reg?.waiting || null;
      if (!target) {
        setOfflineInfo('Service worker is not active yet.');
        return;
      }
      target.postMessage({ type: 'CLEAR_CACHES', confirm: true });
      setOfflineInfo('Offline cache cleared. Reloading…');
      window.location.reload();
    } catch (e) {
      setOfflineInfo(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setOfflineBusy(false);
    }
  };

  const refreshOfflineCacheStatus = async () => {
    setOfflineBusy(true);
    setOfflineInfo(null);
    setOfflineCacheStatus(null);
    try {
      if (!('serviceWorker' in navigator)) {
        setOfflineInfo('Service worker not supported in this browser.');
        return;
      }

      const controller = navigator.serviceWorker.controller;
      const reg = await navigator.serviceWorker.getRegistration('/');
      const target = controller || reg?.active || reg?.waiting || null;
      if (!target) {
        setOfflineInfo('Service worker is not active yet.');
        return;
      }

      const payload = await new Promise<any>((resolve) => {
        const timeout = window.setTimeout(() => resolve({ error: 'timeout' }), 5_000);
        const onMessage = (event: MessageEvent) => {
          const data = (event as any)?.data;
          if (data && typeof data === 'object' && data.type === 'CACHE_STATUS') {
            window.clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('message', onMessage as any);
            resolve(data);
          }
        };
        navigator.serviceWorker.addEventListener('message', onMessage as any);
        target.postMessage({ type: 'GET_CACHE_STATUS' });
      });

      if (payload?.error) {
        setOfflineInfo(`Cache status error: ${String(payload.error).slice(0, 140)}`);
        return;
      }
      const entries = Array.isArray(payload?.entries) ? payload.entries : [];
      const top = entries
        .slice()
        .sort((a: any, b: any) => (b?.entries ?? 0) - (a?.entries ?? 0))
        .slice(0, 10)
        .map((x: any) => `${String(x?.name ?? 'cache')}: ${String(x?.entries ?? '?')}`)
        .join('\n');
      const header = `Caches: ${payload?.cacheCount ?? entries.length}`;
      setOfflineCacheStatus(top ? `${header}\n${top}` : header);
    } catch (e) {
      setOfflineInfo(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setOfflineBusy(false);
    }
  };

  const linkConnectedWallet = async (args: {
    walletAddress: string;
    tonProof: Record<string, unknown> | null;
    publicKey: unknown;
    network: string;
  }) => {
    if (!token) return;
    if (wallets.some((w) => w.address === args.walletAddress)) return;
    if (!args.tonProof) {
      setLinkInfo('Missing ton_proof.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallets/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          walletAddress: args.walletAddress,
          tonProof: args.tonProof,
          publicKey: args.publicKey,
          network: args.network,
          label: walletLabel.trim() || null,
          setPrimary: walletSetPrimary,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; token?: unknown; error?: unknown } | null;
      const nextToken = typeof json?.token === 'string' ? json.token : '';
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to link wallet');
        return;
      }
      if (nextToken) setToken(nextToken);
      setWalletLabel('');
      setWalletSetPrimary(false);
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPrefLang(lang);
  }, [lang]);

  useEffect(() => {
    setPrefTheme(theme ?? 'dark');
  }, [theme]);

  const savePreferences = async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ locale: prefLang, theme: prefTheme }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to save preferences');
        return;
      }
      setLang(prefLang);
      setTheme(prefTheme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const startMfaSetup = async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/security/mfa/setup', { method: 'POST', headers: authHeaders });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; secretBase32?: unknown; otpauthUrl?: unknown; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to start setup');
        return;
      }
      const secretBase32 = typeof json.secretBase32 === 'string' ? json.secretBase32 : '';
      const otpauthUrl = typeof json.otpauthUrl === 'string' ? json.otpauthUrl : '';
      if (!secretBase32 || !otpauthUrl) {
        setError('Invalid setup payload');
        return;
      }
      setSetupSecret({ secretBase32, otpauthUrl });
      setSetupCode('');
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const enableMfa = async () => {
    if (!authHeaders) return;
    const code = setupCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter a 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/security/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to enable 2FA');
        return;
      }
      setSetupSecret(null);
      setSetupCode('');
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    if (!authHeaders) return;
    const code = disableCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter a 6-digit code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/security/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to disable 2FA');
        return;
      }
      setDisableCode('');
      setSessionMfaCode('');
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeaders };
      if (mfa.enabled && /^\d{6}$/.test(sessionMfaCode.trim())) headers['x-mfa-code'] = sessionMfaCode.trim();
      const res = await fetch('/api/security/sessions/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; revoked?: unknown; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to revoke session');
        return;
      }
      if (json.revoked === true) {
        setToken(null);
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { ...authHeaders };
      if (mfa.enabled && /^\d{6}$/.test(sessionMfaCode.trim())) headers['x-mfa-code'] = sessionMfaCode.trim();
      const res = await fetch('/api/security/sessions/revoke-all', { method: 'POST', headers });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: unknown } | null;
      if (!res.ok || !json?.ok) {
        setError(typeof json?.error === 'string' ? json.error : 'Failed to revoke sessions');
        return;
      }
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-3xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Security settings</h1>
        <p className="mt-2 text-white/70 text-sm">
          Protect your account with 2FA (TOTP) and review your active sessions.
        </p>

        {!isAuthenticated ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-5">
            <div className="text-white/90 font-medium">Connect your wallet to manage security.</div>
            <div className="mt-4">
              <WalletConnect />
            </div>
          </div>
        ) : null}

        {isAuthenticated ? (
          <div className="mt-6 grid gap-6">
            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-semibold">Mobile & PWA</div>
                  <div className="mt-1 text-white/70 text-sm">Reduce background refresh and network usage.</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={
                      dataSaver
                        ? 'px-3 py-2 rounded-xl bg-solaris-gold/20 text-solaris-gold text-xs font-mono'
                        : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
                    }
                    onClick={() => setDataSaver(!dataSaver)}
                  >
                    Data saver: {dataSaver ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    className={
                      offlineBusy
                        ? 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono opacity-60 cursor-not-allowed'
                        : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
                    }
                    onClick={clearOfflineCache}
                    disabled={offlineBusy}
                  >
                    Clear offline cache
                  </button>
                  <button
                    type="button"
                    className={
                      offlineBusy
                        ? 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono opacity-60 cursor-not-allowed'
                        : 'px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono'
                    }
                    onClick={refreshOfflineCacheStatus}
                    disabled={offlineBusy}
                  >
                    Cache status
                  </button>
                </div>
              </div>

              {offlineInfo ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 text-sm">
                  {offlineInfo}
                </div>
              ) : null}

              {offlineCacheStatus ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 text-xs font-mono">
                  {offlineCacheStatus}
                </pre>
              ) : null}
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-semibold">Linked identities</div>
                  <div className="mt-1 text-white/70 text-sm">Connect Telegram and GitHub as secondary sign-in methods.</div>
                </div>
              </div>

              {linkInfo ? (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-white/80 text-sm">{linkInfo}</div>
              ) : null}

              <div className="mt-5 grid gap-6">
                {telegramBotUsername ? (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-white/90 font-medium">Telegram Login</div>
                    <div className="mt-1 text-white/70 text-sm">Authenticate once to bind your Telegram account.</div>
                    {telegramWidgetEnabled ? (
                      <div id="telegram-link" className="mt-3" />
                    ) : (
                      <button
                        type="button"
                        className="btn-gold text-sm disabled:opacity-60 mt-3"
                        onClick={() => setTelegramWidgetEnabled(true)}
                      >
                        Load Telegram
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-white/90 font-medium">Telegram Login</div>
                    <div className="mt-1 text-white/70 text-sm">Setează `VITE_TELEGRAM_BOT_USERNAME` ca să activezi widget-ul.</div>
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/90 font-medium">GitHub OAuth</div>
                  <div className="mt-1 text-white/70 text-sm">Authorize GitHub to bind your account.</div>
                  <button
                    type="button"
                    className="btn-gold text-sm disabled:opacity-60 mt-3"
                    onClick={linkGithub}
                    disabled={linkBusy || loading}
                  >
                    Link GitHub
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/90 font-medium">Twitter OAuth</div>
                  <div className="mt-1 text-white/70 text-sm">Authorize Twitter to bind your account.</div>
                  <button
                    type="button"
                    className="btn-gold text-sm disabled:opacity-60 mt-3"
                    onClick={linkTwitter}
                    disabled={linkBusy || loading}
                  >
                    Link Twitter
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-semibold">TON wallets</div>
                  <div className="mt-1 text-white/70 text-sm">Multiple wallets per account, with one primary.</div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/90 font-medium">Link another wallet</div>
                  <div className="mt-1 text-white/70 text-sm">Connect a wallet and it will be linked to this account.</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-white/80 text-sm">Label</span>
                      <input
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
                        value={walletLabel}
                        onChange={(e) => setWalletLabel(e.target.value.slice(0, 60))}
                        placeholder="ex: Ledger"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-white/80 text-sm">
                      <input type="checkbox" checked={walletSetPrimary} onChange={(e) => setWalletSetPrimary(e.target.checked)} />
                      Set as primary
                    </label>
                  </div>
                  <div className="mt-4">
                    <WalletConnect mode="link" onProof={linkConnectedWallet} />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/90 font-medium">Linked wallets</div>
                  <div className="mt-3 space-y-2">
                    {wallets.length === 0 ? (
                      <div className="text-white/60 text-sm">No linked wallets yet.</div>
                    ) : (
                      wallets.map((w) => (
                        <div key={w.address} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-white/90 text-sm truncate">
                              {w.label ? `${w.label} · ` : ''}
                              <span className="font-mono">{w.address}</span>
                              {w.isPrimary ? <span className="ml-2 text-xs text-solaris-gold font-semibold">Primary</span> : null}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono disabled:opacity-50"
                            onClick={() => unlinkWallet(w.address)}
                            disabled={loading || w.isPrimary}
                          >
                            Unlink
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-white font-semibold">Appearance</div>
                  <div className="mt-1 text-white/70 text-sm">Theme and language preferences.</div>
                </div>
                <button type="button" className="btn-gold text-sm disabled:opacity-60" onClick={savePreferences} disabled={loading}>
                  Save
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-white/80 text-sm">Language</span>
                  <select
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value as LangCode)}
                  >
                    {SUPPORTED_LANGS.map((code) => (
                      <option key={code} value={code} className="bg-black">
                        {code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-white/80 text-sm">Theme</span>
                  <select
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
                    value={prefTheme}
                    onChange={(e) => setPrefTheme(e.target.value)}
                  >
                    <option value="dark" className="bg-black">Dark</option>
                    <option value="light" className="bg-black">Light</option>
                    <option value="system" className="bg-black">System</option>
                  </select>
                </label>
              </div>
            </section>
            {error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-red-200 text-sm">{error}</div>
            ) : null}

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-semibold">Two-factor authentication (TOTP)</div>
                  <div className="mt-1 text-white/70 text-sm">
                    Use an authenticator app (Google Authenticator, 1Password, Authy, etc.).
                  </div>
                </div>
                {!mfa.enabled ? (
                  <button
                    type="button"
                    className="btn-gold text-sm disabled:opacity-60"
                    onClick={startMfaSetup}
                    disabled={loading}
                  >
                    {mfa.pending ? 'Reset setup' : 'Enable 2FA'}
                  </button>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 text-emerald-200 text-xs">
                    Enabled
                  </span>
                )}
              </div>

              {!mfa.enabled && setupSecret ? (
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-2">
                    <div className="text-white/90 text-sm font-medium">1) Add to your authenticator</div>
                    <div className="text-white/70 text-sm">
                      Secret (Base32): <span className="text-white">{setupSecret.secretBase32}</span>
                    </div>
                    <div className="text-white/70 text-sm break-all">
                      otpauth URL: <span className="text-white">{setupSecret.otpauthUrl}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-white/90 text-sm font-medium">2) Confirm code</div>
                    <InputOTP maxLength={6} value={setupCode} onChange={setSetupCode} containerClassName="mt-1">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="btn-gold text-sm disabled:opacity-60"
                        onClick={enableMfa}
                        disabled={loading}
                      >
                        Confirm & enable
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-sm disabled:opacity-60"
                        onClick={() => setSetupSecret(null)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {mfa.enabled ? (
                <div className="mt-5 grid gap-3">
                  <div className="text-white/80 text-sm">To disable 2FA, confirm a valid code.</div>
                  <InputOTP maxLength={6} value={disableCode} onChange={setDisableCode} containerClassName="mt-1">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-200 border-red-500/30 hover:border-red-500/40 disabled:opacity-60"
                    onClick={disableMfa}
                    disabled={loading}
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-semibold">Active sessions</div>
                  <div className="mt-1 text-white/70 text-sm">Review devices and revoke access.</div>
                </div>
                <button
                  type="button"
                  className="btn-ghost text-sm disabled:opacity-60"
                  onClick={revokeAllOtherSessions}
                  disabled={loading || !sessions?.currentSessionId}
                >
                  Revoke other sessions
                </button>
              </div>

              {mfa.enabled ? (
                <div className="mt-4 grid gap-2">
                  <div className="text-white/80 text-sm">2FA enabled: enter a code to revoke sessions.</div>
                  <InputOTP maxLength={6} value={sessionMfaCode} onChange={setSessionMfaCode} containerClassName="mt-1">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                {(sessions?.sessions ?? []).length === 0 ? (
                  <div className="text-white/70 text-sm">No sessions found.</div>
                ) : (
                  (sessions?.sessions ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-white/10 bg-black/30 p-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-white/90 text-sm font-medium">
                          {s.current ? 'This device' : s.active ? 'Active session' : 'Inactive session'}
                        </div>
                        <div className="mt-1 text-white/60 text-xs break-words">
                          {s.userAgent ? s.userAgent : 'Unknown user agent'}
                        </div>
                        <div className="mt-1 text-white/60 text-xs">
                          {s.ip ? `IP: ${s.ip}` : 'IP: unknown'} · Created: {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {!s.revokedAt ? (
                        <button
                          type="button"
                          className="btn-ghost text-xs disabled:opacity-60"
                          onClick={() => revokeSession(s.id)}
                          disabled={loading}
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-white/50 text-xs">Revoked</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="text-white font-semibold">Security tips</div>
              <ul className="mt-2 text-white/70 text-sm grid gap-1 list-disc pl-5">
                <li>Enable 2FA to protect against wallet-session token theft.</li>
                <li>Revoke old sessions after switching devices or using public Wi-Fi.</li>
                <li>Never paste your JWT token or 2FA codes into chat or forms.</li>
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
