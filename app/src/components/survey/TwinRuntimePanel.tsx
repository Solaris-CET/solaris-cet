import { Activity, Radio, RefreshCw } from 'lucide-react';

import { useTwinStream } from '@/hooks/useTwinStream';
import { twinFeedMapLabel } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

import { TwinMapViewer } from './TwinMapViewer';

type Props = {
  reportId: string;
  className?: string;
};

export function TwinRuntimePanel({ reportId, className }: Props) {
  const { feed, events, ready, error, loading, reconnect } = useTwinStream(reportId);

  return (
    <div className={cn('rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-fuchsia-200">
          <Radio className={cn('h-3.5 w-3.5', ready && 'text-emerald-400')} />
          Twin runtime {ready ? 'live' : 'connecting…'}
        </p>
        <button
          type="button"
          onClick={() => void reconnect()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          Reconnect
        </button>
      </div>

      {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}

      {feed ? (
        <>
          <TwinMapViewer
            latitude={feed.site.latitude}
            longitude={feed.site.longitude}
            className="mt-2"
          />
          <p className="mt-2 text-[11px] text-white/65">
            {feed.site.client_name} · {feed.site.city} · {twinFeedMapLabel(feed.site.latitude, feed.site.longitude)}
          </p>
          <p className="text-[11px] text-white/55">
            {feed.system.capacity_kwp} kWp · scor {feed.system.suitability_score}/100
          </p>
        </>
      ) : !error ? (
        <p className="mt-2 text-[11px] text-white/40">Se încarcă stream SSE…</p>
      ) : null}

      {events.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-white/10 pt-2">
          {events.slice(0, 5).map((ev) => (
            <li key={ev.event_id} className="flex items-center gap-2 text-[10px] text-white/50">
              <Activity className="h-3 w-3 text-fuchsia-300/70" />
              <span className="font-mono text-fuchsia-200/80">{ev.event_type}</span>
              <span>{new Date(ev.timestamp).toLocaleTimeString('ro-RO')}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}