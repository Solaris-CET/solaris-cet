import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/hooks/authContext';
import { truncateAddress } from '@/lib/utils';

type AdminUser = {
  id: string;
  role: string;
  displayName: string | null;
  walletAddress: string | null;
  telegramUserId: string | null;
  telegramUsername: string | null;
  oauthProvider: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export default function AdminPage() {
  const { state, logout } = useAuth();
  const current = state.status === 'authenticated' ? state.user : null;
  const canView = current?.role === 'admin';
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mfaCode, setMfaCode] = useState('');
  const [setup, setSetup] = useState<{ secretBase32: string; otpauthUrl: string } | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mfaHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (mfaCode.trim()) h['x-mfa-code'] = mfaCode.trim();
    return h;
  }, [mfaCode]);

  async function loadUsers() {
    const res = await apiFetch<{ users: AdminUser[] }>('/api/admin/users', { headers: mfaHeaders });
    setUsers(res.users);
  }

  useEffect(() => {
    if (!canView) return;
    void (async () => {
      try {
        setErr(null);
        await loadUsers();
      } catch {
        setErr('Acces refuzat sau MFA necesar.');
      }
    })();
  }, [canView]);

  async function startMfaSetup() {
    setBusy(true);
    try {
      setErr(null);
      const res = await apiFetch<{ secretBase32: string; otpauthUrl: string }>('/api/mfa/setup', { method: 'POST' });
      setSetup(res);
    } catch {
      setErr('Nu am putut genera MFA.');
    } finally {
      setBusy(false);
    }
  }

  async function enableMfa() {
    setBusy(true);
    try {
      setErr(null);
      await apiFetch('/api/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: enableCode }),
      });
      setEnableCode('');
      await loadUsers();
    } catch {
      setErr('Cod invalid.');
    } finally {
      setBusy(false);
    }
  }

  async function setRole(id: string, role: string) {
    setBusy(true);
    try {
      setErr(null);
      await apiFetch('/api/admin/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mfa-code': mfaCode.trim() },
        body: JSON.stringify({ userId: id, role }),
      });
      await loadUsers();
    } catch {
      setErr('Nu am putut schimba rolul (MFA?).');
    } finally {
      setBusy(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <div className="h-7 w-40 bg-white/10 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (!canView) {
    return (
      <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="font-display text-2xl text-white">Admin</h1>
          <p className="mt-2 text-sm text-white/70">Nu ai acces.</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="relative z-10 px-6 py-16">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight">Admin</h1>
            <div className="mt-2 text-sm text-white/70">MFA protejează acțiunile admin.</div>
          </div>
          <a href="/app" className="rounded-xl bg-solaris-gold px-4 py-2 text-solaris-dark font-semibold">Înapoi la cont</a>
        </div>

        {err ? <div className="mt-4 text-sm text-red-200">{err}</div> : null}

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="text-sm font-semibold text-white">2FA (TOTP)</div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/80">Setup</div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startMfaSetup()}
                className="mt-3 rounded-xl bg-solaris-gold px-4 py-2 text-solaris-dark font-semibold disabled:opacity-60"
              >
                Generează secret
              </button>
              {setup ? (
                <div className="mt-4 text-xs text-white/70 space-y-2">
                  <div>
                    Secret: <span className="font-mono text-white/90">{setup.secretBase32}</span>
                  </div>
                  <div className="break-all">otpauth: {setup.otpauthUrl}</div>
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/80">Enable</div>
              <div className="mt-3 flex gap-3">
                <input
                  value={enableCode}
                  onChange={(e) => setEnableCode(e.target.value)}
                  placeholder="Cod 6 cifre"
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white font-mono"
                />
                <button
                  type="button"
                  disabled={busy || enableCode.trim().length < 6}
                  onClick={() => void enableMfa()}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  Activează
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm font-semibold text-white">Users</div>
            <div className="flex items-center gap-3">
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="MFA (6 cifre)"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white font-mono"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void loadUsers()}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Wallet</th>
                  <th className="py-2 pr-3">Telegram</th>
                  <th className="py-2 pr-3">OAuth</th>
                  <th className="py-2 pr-3">Rol</th>
                  <th className="py-2">Acțiune</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/10">
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{u.displayName ?? truncateAddress(u.id, 8)}</div>
                      <div className="text-xs text-white/60">{truncateAddress(u.id, 8)}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{u.walletAddress ? truncateAddress(u.walletAddress, 8) : '—'}</td>
                    <td className="py-2 pr-3 text-xs">
                      {u.telegramUsername ? `@${u.telegramUsername}` : u.telegramUserId ? truncateAddress(u.telegramUserId, 6) : '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs">{u.oauthProvider ?? '—'}</td>
                    <td className="py-2 pr-3 font-semibold">{u.role}</td>
                    <td className="py-2">
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => void setRole(u.id, e.target.value)}
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
                      >
                        <option value="visitor">visitor</option>
                        <option value="investor">investor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

