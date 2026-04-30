import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { adminApi } from '../adminClient';

type Row = { id: string; walletAddress: string | null; title: string | null; messages: number };

export function ConversationsSection({ token }: { token: string }) {
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminApi<{ conversations: Row[] }>('/api/admin/ai/conversations', { token });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setItems(res.data.conversations);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const del = async (id: string) => {
    if (!confirm('Ștergi conversația AI?')) return;
    const res = await adminApi<{ ok: true }>(`/api/admin/ai/conversations?id=${encodeURIComponent(id)}`, { token, method: 'DELETE' });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Conversații AI</div>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 overflow-auto">
        <table className="w-full text-sm text-white/80">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Title</th>
              <th className="text-right py-2">Messages</th>
              <th className="text-right py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="py-2 font-mono text-xs break-all">{c.walletAddress ?? '—'}</td>
                <td className="py-2">{c.title ?? '—'}</td>
                <td className="py-2 text-right">{c.messages}</td>
                <td className="py-2 text-right">
                  <Button variant="destructive" size="sm" onClick={() => del(c.id)}>
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
