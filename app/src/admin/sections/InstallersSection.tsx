import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchInstallersAggregate, type InstallerAggregate } from '@/lib/installerApi';

import { useAdminSession } from '../useAdminSession';

export function InstallersSection() {
  const { token } = useAdminSession();
  const [rows, setRows] = useState<InstallerAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchInstallersAggregate(token);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la încărcare');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Instalatori SaaS</h2>
          <p className="text-sm text-white/55">Agregat din registry survey-engine + chei API configurate</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {rows.length === 0 && !loading ? (
        <p className="text-sm text-white/50">Niciun instalator în registry încă.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/45 text-xs">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Rapoarte</th>
                <th className="py-2 pr-3">kWp total</th>
                <th className="py-2 pr-3">Scor mediu</th>
                <th className="py-2 pr-3">Premium</th>
                <th className="py-2 pr-3">Cheie API</th>
                <th className="py-2">Ultimul raport</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.installer_id} className="border-b border-white/5 text-white/80">
                  <td className="py-2 pr-3 font-mono text-amber-200/90">{row.installer_id}</td>
                  <td className="py-2 pr-3">{row.report_count}</td>
                  <td className="py-2 pr-3">{row.total_capacity_kwp}</td>
                  <td className="py-2 pr-3">{row.avg_score}/100</td>
                  <td className="py-2 pr-3">{row.premium_count}</td>
                  <td className="py-2 pr-3">
                    {row.api_key_configured ? (
                      <span className="text-emerald-300">Da</span>
                    ) : (
                      <span className="text-white/40">Nu</span>
                    )}
                  </td>
                  <td className="py-2 text-xs text-white/45">
                    {row.last_report_at ? new Date(row.last_report_at).toLocaleString('ro-RO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}