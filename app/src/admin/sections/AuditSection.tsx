import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { adminApi } from '../adminClient';

type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
};

export function AuditSection({ token }: { token: string }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminApi<{ audit: AuditRow[] }>('/api/admin/audit?sinceHours=168', { token });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRows(res.data.audit);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-white text-lg font-semibold">Audit log</div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Card className="border border-white/10 bg-black/30 p-4 overflow-auto max-h-[640px]">
        <table className="w-full text-sm text-white/80">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="text-left py-2">At</th>
              <th className="text-left py-2">Action</th>
              <th className="text-left py-2">Target</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="py-2 font-mono text-xs">{String(r.createdAt).slice(0, 19).replace('T', ' ')}</td>
                <td className="py-2">{r.action}</td>
                <td className="py-2 font-mono text-xs">{r.targetType ?? ''}{r.targetId ? `:${r.targetId}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
