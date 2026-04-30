import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import type { AdminRole } from '../adminClient';
import { adminApi } from '../adminClient';

type InviteRow = {
  id: string;
  role: AdminRole;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: string;
};

export function InvitesSection({ token }: { token: string }) {
  const [items, setItems] = useState<InviteRow[]>([]);
  const [role, setRole] = useState<AdminRole>('viewer');
  const [maxUses, setMaxUses] = useState('1');
  const [expiresInHours, setExpiresInHours] = useState('168');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const baseInviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    url.searchParams.set('invite', '__TOKEN__');
    return url.toString();
  }, []);

  const load = useCallback(async () => {
    const res = await adminApi<{ invites: InviteRow[] }>('/api/admin/invites', { token });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setItems(res.data.invites);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    setCreatedToken(null);
    try {
      const mu = Number(maxUses);
      const eh = Number(expiresInHours);
      const res = await adminApi<{ token: string }>('/api/admin/invites', { token, method: 'POST', body: { role, maxUses: mu, expiresInHours: eh } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCreatedToken(res.data.token);
      void load();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoci invitația?')) return;
    const res = await adminApi<{ ok: true }>(`/api/admin/invites?id=${encodeURIComponent(id)}`, { token, method: 'DELETE' });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    void load();
  };

  const inviteUrl = createdToken ? baseInviteUrl.replace('__TOKEN__', createdToken) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Invite links</div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 space-y-3">
        <div className="text-white/90 text-sm font-medium">Creează invitație</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-white/60 mb-1">Role</div>
            <select
              className="w-full bg-black/40 border border-white/10 text-white/80 text-sm rounded px-2 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
            >
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Max uses</div>
            <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Expires (hours)</div>
            <Input value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} />
          </div>
        </div>
        <Button onClick={create} disabled={busy}>{busy ? 'Generez…' : 'Generează'}</Button>
        {inviteUrl ? (
          <div className="text-xs text-white/80 font-mono break-all">{inviteUrl}</div>
        ) : null}
      </Card>

      <Card className="border border-white/10 bg-black/30 p-4 overflow-auto">
        <table className="w-full text-sm text-white/80">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-2">Role</th>
              <th className="text-left py-2">Status</th>
              <th className="text-right py-2">Uses</th>
              <th className="text-right py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-white/10">
                <td className="py-2">{i.role}</td>
                <td className="py-2">{i.status}</td>
                <td className="py-2 text-right">{i.usedCount}/{i.maxUses}</td>
                <td className="py-2 text-right">
                  <Button variant="destructive" size="sm" onClick={() => revoke(i.id)} disabled={i.status !== 'active'}>
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
