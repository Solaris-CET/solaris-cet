import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import WalletConnect from '@/components/WalletConnect';
import { useJwtSession } from '@/hooks/useJwtSession';

function shortAddress(a: string) {
  const s = a.trim();
  if (s.length <= 16) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

export default function LoginPage() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { token, setToken, isAuthenticated } = useJwtSession();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [telegramWidgetEnabled, setTelegramWidgetEnabled] = useState(false);

  const address = useMemo(() => wallet?.account?.address?.trim() ?? '', [wallet?.account?.address]);
  const telegramBotUsername = useMemo(() => String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? '').trim(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const tokenMatch = hash.match(/(?:^#|&)token=([^&]+)/);
    const errMatch = hash.match(/(?:^#|&)oauth_error=([^&]+)/);
    if (tokenMatch?.[1]) {
      try {
        setToken(decodeURIComponent(tokenMatch[1]));
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        void 0;
      }
    }
    if (errMatch?.[1]) {
      setOauthError(decodeURIComponent(errMatch[1]));
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        void 0;
      }
    }
  }, [setToken]);

  useEffect(() => {
    if (!telegramBotUsername) return;
    if (!telegramWidgetEnabled) return;
    (window as unknown as { onTelegramAuth?: (u: Record<string, unknown>) => void }).onTelegramAuth = async (u) => {
      setOauthError(null);
      try {
        const res = await fetch('/api/auth/telegram/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u),
        });
        const json = (await res.json().catch(() => null)) as { token?: unknown; error?: unknown } | null;
        const t = typeof json?.token === 'string' ? json.token : '';
        if (!res.ok || !t) {
          setOauthError(typeof json?.error === 'string' ? json.error : 'Telegram login failed');
          return;
        }
        setToken(t);
      } catch (e) {
        setOauthError(String(e instanceof Error ? e.message : e).slice(0, 160));
      }
    };
    const container = document.getElementById('telegram-login');
    if (!container) return;
    container.replaceChildren();
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.setAttribute('data-telegram-login', telegramBotUsername);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    s.setAttribute('data-request-access', 'write');
    container.appendChild(s);
  }, [setToken, telegramBotUsername, telegramWidgetEnabled]);

  const startGithub = async () => {
    setOauthBusy(true);
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/oauth/github/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: '/login' }),
      });
      const json = (await res.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      const u = typeof json?.url === 'string' ? json.url : '';
      if (!res.ok || !u) {
        setOauthError(typeof json?.error === 'string' ? json.error : 'GitHub OAuth not available');
        return;
      }
      window.location.assign(u);
    } catch (e) {
      setOauthError(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setOauthBusy(false);
    }
  };

  const startTwitter = async () => {
    setOauthBusy(true);
    setOauthError(null);
    try {
      const res = await fetch('/api/auth/oauth/twitter/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnTo: '/login' }),
      });
      const json = (await res.json().catch(() => null)) as { url?: unknown; error?: unknown } | null;
      const u = typeof json?.url === 'string' ? json.url : '';
      if (!res.ok || !u) {
        setOauthError(typeof json?.error === 'string' ? json.error : 'Twitter OAuth not available');
        return;
      }
      window.location.assign(u);
    } catch (e) {
      setOauthError(String(e instanceof Error ? e.message : e).slice(0, 160));
    } finally {
      setOauthBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setInfo(null);
    try {
      if (token) {
        try {
          await fetch('/api/auth', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        } catch {
          void 0;
        }
      }
      setToken(null);
      try {
        await tonConnectUI.disconnect();
      } catch {
        void 0;
      }
      setInfo('Deconectat.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-white text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-3 text-white/70 text-sm">
          Conectează wallet-ul TON. După conectare, site-ul va cere o dovadă (`ton_proof`) și va salva un JWT local.
        </p>

        {oauthError ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-red-200 text-sm">
            {oauthError}
          </div>
        ) : null}

        {telegramBotUsername ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/60 font-mono">Telegram</div>
            <div className="mt-2 text-white/70 text-sm">Funcționează după ce faci link în Security settings.</div>
            {telegramWidgetEnabled ? (
              <div id="telegram-login" className="mt-3" />
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
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-white/60 font-mono">GitHub</div>
          <div className="mt-2 text-white/70 text-sm">Funcționează după ce faci link în Security settings.</div>
          <button type="button" className="btn-gold text-sm disabled:opacity-60 mt-3" onClick={startGithub} disabled={oauthBusy}>
            Continue with GitHub
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-white/60 font-mono">Twitter</div>
          <div className="mt-2 text-white/70 text-sm">Funcționează după ce faci link în Security settings.</div>
          <button type="button" className="btn-gold text-sm disabled:opacity-60 mt-3" onClick={startTwitter} disabled={oauthBusy}>
            Continue with Twitter
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs text-white/60 font-mono">Wallet</div>
          <div className="mt-1 text-white font-mono text-sm">{address ? shortAddress(address) : 'Neconectat'}</div>
          <div className="mt-2 text-xs">
            <span className={isAuthenticated ? 'text-emerald-300 font-mono' : 'text-white/60 font-mono'}>
              {isAuthenticated ? 'JWT: activ' : 'JWT: inactiv'}
            </span>
            {info ? <span className="ml-2 text-white/60">{info}</span> : null}
          </div>
        </div>

        <div className="mt-6">
          <WalletConnect />
        </div>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <a href="/app" className="px-4 py-2 rounded-xl bg-solaris-gold text-solaris-dark font-semibold">
            Continuă
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
            onClick={() => void logout()}
            disabled={busy}
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Logout
          </button>
          <a href="/" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
            Acasă
          </a>
        </div>
      </div>
    </main>
  );
}
