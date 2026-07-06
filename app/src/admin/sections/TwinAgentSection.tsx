import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchTwinAgentDecisions } from '@/lib/twinAgentApi';
import type { TwinAgentDecision } from '@/lib/twinAgent';

import { useAdminSession } from '../useAdminSession';

export function TwinAgentSection() {
  const { token } = useAdminSession();
  const [decisions, setDecisions] = useState<TwinAgentDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const rows = await fetchTwinAgentDecisions(undefined, 50);
      setDecisions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare');
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
          <h2 className="text-lg font-semibold text-white">Twin AI agent</h2>
          <p className="text-sm text-white/55">Decizii agent — plan, acțiuni, reassess din twin events</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {decisions.length === 0 && !loading ? (
        <p className="text-sm text-white/50">Nicio decizie agent încă. Generează un raport demo.</p>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {decisions.map((d) => (
            <div key={d.event_id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-cyan-200">{d.event_type}</span>
                <span className="text-xs text-white/45">
                  {new Date(d.timestamp).toLocaleString('ro-RO')}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-amber-200/80">{d.report_id}</p>
              {Object.keys(d.payload).length > 0 ? (
                <p className="mt-1 text-xs text-white/55">{JSON.stringify(d.payload)}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}