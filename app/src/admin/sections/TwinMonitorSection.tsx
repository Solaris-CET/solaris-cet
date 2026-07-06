import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchTwinEvents } from '@/lib/twinRuntimeApi';
import type { TwinEvent } from '@/lib/twinRuntime';

import { useAdminSession } from '../useAdminSession';

export function TwinMonitorSection() {
  const { token } = useAdminSession();
  const [events, setEvents] = useState<TwinEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const rows = await fetchTwinEvents(undefined, 40);
      setEvents(rows);
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
          <h2 className="text-lg font-semibold text-white">Twin runtime monitor</h2>
          <p className="text-sm text-white/55">Evenimente SSE din `twin_events.jsonl` — D10 live layer</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? 'Se încarcă...' : 'Reîmprospătează'}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {events.length === 0 && !loading ? (
        <p className="text-sm text-white/50">Niciun eveniment twin încă. Generează un raport demo.</p>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {events.map((ev) => (
            <div key={ev.event_id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-fuchsia-200">{ev.event_type}</span>
                <span className="text-xs text-white/45">{new Date(ev.timestamp).toLocaleString('ro-RO')}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-amber-200/80">{ev.report_id}</p>
              {Object.keys(ev.payload).length > 0 ? (
                <p className="mt-1 text-xs text-white/55">{JSON.stringify(ev.payload)}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}