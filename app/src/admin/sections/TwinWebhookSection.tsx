import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { fetchTwinWebhookDeliveries } from '@/lib/twinWebhookApi';
import type { TwinWebhookDelivery } from '@/lib/twinWebhook';

import { useAdminSession } from '../useAdminSession';

export function TwinWebhookSection() {
  const { token } = useAdminSession();
  const [deliveries, setDeliveries] = useState<TwinWebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const direction = filter === 'all' ? undefined : filter;
      const res = await fetchTwinWebhookDeliveries(50, direction);
      setDeliveries(res.deliveries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Twin CRM webhooks</h2>
          <p className="text-sm text-white/55">Jurnal livrări inbound/outbound — `TWIN_WEBHOOK_URL`</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'inbound', 'outbound'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 text-xs border ${
                filter === f ? 'border-amber-200/30 bg-white/5 text-white' : 'border-white/10 text-white/60'
              }`}
            >
              {f}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? 'Se încarcă...' : 'Reîmprospătează'}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {deliveries.length === 0 && !loading ? (
        <p className="text-sm text-white/50">Nicio livrare webhook încă. Setează `TWIN_WEBHOOK_URL` sau trimite inbound POST.</p>
      ) : (
        <div className="space-y-2 max-h-[28rem] overflow-y-auto">
          {deliveries.map((d) => (
            <div key={d.delivery_id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-cyan-200">
                  {d.direction} · {d.status}
                </span>
                <span className="text-xs text-white/45">{new Date(d.timestamp).toLocaleString('ro-RO')}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-fuchsia-200/80">
                {d.event_type} · {d.report_id}
                {d.http_status != null ? ` · HTTP ${d.http_status}` : ''}
              </p>
              {d.detail ? <p className="mt-1 text-xs text-amber-200/70">{d.detail}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}