import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { adminApi } from '../adminClient';

type SettingRow = { key: string; value: unknown; updatedAt: string };

export function SettingsSection({ token }: { token: string }) {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('{}');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaOtpAuthUrl, setMfaOtpAuthUrl] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const load = useCallback(async () => {
    const res = await adminApi<{ settings: SettingRow[] }>('/api/admin/settings', { token });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRows(res.data.settings);
    setError(null);

    const mfaRes = await adminApi<{ enabled: boolean; pending: boolean }>('/api/admin/mfa', { token });
    if (mfaRes.ok) {
      setMfaEnabled(Boolean(mfaRes.data.enabled));
      setMfaPending(Boolean(mfaRes.data.pending));
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        setError('Value trebuie să fie JSON valid');
        return;
      }
      const res = await adminApi<{ setting: SettingRow }>('/api/admin/settings', { token, method: 'PUT', body: { key, value: parsed } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setKey('');
      setValue('{}');
      void load();
    } finally {
      setBusy(false);
    }
  };

  const clearCache = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true; deleted: number }>('/api/admin/cache/clear', { token, method: 'POST' });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      alert(`Cache clear: ${res.data.deleted} keys`);
    } finally {
      setBusy(false);
    }
  };

  const mfaSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi<{ secret: string; otpauthUrl: string }>('/api/admin/mfa/setup', { token, method: 'POST' });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMfaSecret(res.data.secret);
      setMfaOtpAuthUrl(res.data.otpauthUrl);
      setMfaPending(true);
    } finally {
      setBusy(false);
    }
  };

  const mfaEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true }>('/api/admin/mfa/enable', { token, method: 'POST', body: { code: mfaCode } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMfaEnabled(true);
      setMfaPending(false);
      setMfaSecret(null);
      setMfaOtpAuthUrl(null);
      setMfaCode('');
    } finally {
      setBusy(false);
    }
  };

  const mfaDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi<{ ok: true }>('/api/admin/mfa/disable', { token, method: 'POST', body: { code: mfaCode } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMfaEnabled(false);
      setMfaPending(false);
      setMfaSecret(null);
      setMfaOtpAuthUrl(null);
      setMfaCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Setări globale</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>Refresh</Button>
          <Button variant="destructive" onClick={clearCache} disabled={busy}>Curăță cache (Redis)</Button>
        </div>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-white/90 text-sm font-medium">2FA (Admin)</div>
            <div className="text-xs text-white/60">TOTP pentru conturile cu rol admin.</div>
          </div>
          <div className="text-xs text-white/70 font-mono">
            {mfaEnabled ? 'enabled' : mfaPending ? 'pending' : 'disabled'}
          </div>
        </div>

        {mfaSecret ? (
          <div className="rounded border border-white/10 p-3">
            <div className="text-xs text-white/60">Secret</div>
            <div className="mt-1 text-sm text-white font-mono break-all">{mfaSecret}</div>
            {mfaOtpAuthUrl ? (
              <div className="mt-2 text-xs text-white/60 break-all">{mfaOtpAuthUrl}</div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-white/70 mb-1">Cod</div>
            <Input value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
          </div>
          <Button variant="secondary" onClick={mfaSetup} disabled={busy || mfaEnabled}>
            Setup
          </Button>
          <Button onClick={mfaEnable} disabled={busy || mfaEnabled || mfaCode.length !== 6}>
            Enable
          </Button>
          <Button variant="destructive" onClick={mfaDisable} disabled={busy || !mfaEnabled || mfaCode.length !== 6}>
            Disable
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
          <div className="text-white/90 text-sm font-medium">Creează / actualizează</div>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="key" />
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[180px]" />
          <Button onClick={save} disabled={busy || !key}>{busy ? 'Salvez…' : 'Salvează'}</Button>
        </Card>
        <Card className="border border-white/10 bg-black/30 p-4 overflow-auto max-h-[520px]">
          <div className="text-xs text-white/60 mb-2">Setări existente</div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.key} className="rounded border border-white/10 p-3">
                <div className="text-white text-sm font-medium">{r.key}</div>
                <pre className="text-xs text-white/70 overflow-auto">{JSON.stringify(r.value, null, 2)}</pre>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
