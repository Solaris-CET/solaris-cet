import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { AdminSession } from '../adminClient';
import { adminApi } from '../adminClient';

export function LoginView({ onLoggedIn }: { onLoggedIn: (session: AdminSession) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inviteToken = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URL(window.location.href).searchParams.get('invite') ?? '';
  }, []);

  const isInvite = Boolean(inviteToken);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const endpoint = isInvite ? '/api/admin/signup' : '/api/admin/login';
      const body = isInvite ? { token: inviteToken, email, password } : { email, password, mfaCode: mfaCode.trim() || null };
      const res = await adminApi<AdminSession>(endpoint, { token: null, method: 'POST', body });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLoggedIn(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <Card className="max-w-md w-full rounded-2xl border border-white/10 bg-black/30 p-6">
        <div className="text-white text-2xl font-semibold tracking-tight">{isInvite ? 'Creează cont de admin' : 'Admin Login'}</div>
        <div className="mt-2 text-white/70 text-sm">
          {isInvite ? 'Folosești un link de invitație. Setează email + parolă.' : 'Autentificare protejată prin parolă.'}
        </div>
        <div className="mt-6 space-y-3">
          <div>
            <div className="text-xs text-white/70 mb-1">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@solaris-cet.com" />
          </div>
          <div>
            <div className="text-xs text-white/70 mb-1">Parolă</div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Minim 10 caractere" />
          </div>
          {!isInvite ? (
            <div>
              <div className="text-xs text-white/70 mb-1">2FA (TOTP)</div>
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="Cod 6 cifre (dacă e activ)"
              />
            </div>
          ) : null}
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? 'Se procesează…' : isInvite ? 'Creează cont' : 'Login'}
          </Button>
        </div>
      </Card>
    </main>
  );
}
