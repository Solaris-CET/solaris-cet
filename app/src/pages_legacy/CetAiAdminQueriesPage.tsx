import { useCallback, useEffect, useMemo, useState } from 'react';

import { getAuthToken } from '@/lib/authToken';

type AdminQueryRow = {
  id: string;
  user: string;
  createdAt: string;
  query: string;
  model: string;
  latencyMs: number | null;
  usedCache: boolean;
  moderationFlagged: boolean;
  qualityScore: number | null;
};

export default function CetAiAdminQueriesPage() {
  const [rows, setRows] = useState<AdminQueryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = useMemo(() => getAuthToken(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/admin/queries', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json()) as { queries?: AdminQueryRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Unauthorized');
        setRows([]);
      } else {
        setRows(Array.isArray(data.queries) ? data.queries : []);
      }
    } catch {
      setError('Unavailable');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main id="main-content" tabIndex={-1} className="relative mx-auto w-full max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-white">AI Oracle — Admin Queries</h1>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-10 px-4 rounded-xl border border-gray-700 bg-gray-950 text-gray-200 text-sm hover:border-cyan-500/40 hover:text-cyan-200 transition-colors"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-red-300">{error}</p>
      ) : (
        <p className="mt-4 text-white/70 text-sm">Ultimele query-uri (user anonim, hash scurt).</p>
      )}

      <div className="mt-6 overflow-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead className="text-left text-white/60">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Model</th>
              <th className="p-3">ms</th>
              <th className="p-3">Score</th>
              <th className="p-3">Cache</th>
              <th className="p-3">Mod</th>
              <th className="p-3">Query</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-3 font-mono">{r.user}</td>
                <td className="p-3 font-mono">{r.model}</td>
                <td className="p-3 font-mono">{r.latencyMs ?? '-'}</td>
                <td className="p-3 font-mono">{typeof r.qualityScore === 'number' ? r.qualityScore : '-'}</td>
                <td className="p-3">{r.usedCache ? 'yes' : 'no'}</td>
                <td className="p-3">{r.moderationFlagged ? 'flagged' : '-'}</td>
                <td className="p-3 max-w-[720px] break-words">{r.query}</td>
              </tr>
            ))}
            {rows.length === 0 && !error ? (
              <tr>
                <td className="p-4 text-white/50" colSpan={8}>
                  No data.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
