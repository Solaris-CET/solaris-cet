import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { adminApi } from '../adminClient';

type UserRow = { id: string; walletAddress: string; role: string; points: number; email: string | null };

export function UsersSection({ token }: { token: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi<{ users: UserRow[] }>('/api/admin/users', { token });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const del = async (id: string) => {
    if (!confirm('Ștergi contul utilizatorului?')) return;
    const res = await adminApi<{ ok: true }>(`/api/admin/users?id=${encodeURIComponent(id)}`, { token, method: 'DELETE' });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Utilizatori</div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 overflow-auto">
        <table className="w-full text-sm text-white/80">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-2">Wallet</th>
              <th className="text-left py-2">Email</th>
              <th className="text-left py-2">Role</th>
              <th className="text-right py-2">Points</th>
              <th className="text-right py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="py-2 font-mono text-xs break-all">{u.walletAddress}</td>
                <td className="py-2">{u.email ?? '—'}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2 text-right">{u.points}</td>
                <td className="py-2 text-right">
                  <Button variant="destructive" size="sm" onClick={() => del(u.id)}>
                    Șterge
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
