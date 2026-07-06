import { useState } from 'react';
import { Activity, Box, Map, Radio, RefreshCw } from 'lucide-react';

import { useTwinStream } from '@/hooks/useTwinStream';
import { twinFeedMapLabel } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

import { Twin3DViewer } from './Twin3DViewer';
import { TwinMapViewer } from './TwinMapViewer';

type Props = {
  reportId: string;
  className?: string;
};

type ViewMode = 'map' | '3d';

export function TwinRuntimePanel({ reportId, className }: Props) {
  const { feed, events, ready, connected, heartbeats, error, loading, reconnect } = useTwinStream(reportId);
  const [view, setView] = useState<ViewMode>('3d');
  const liveLabel = connected && (ready || heartbeats > 0) ? 'live' : 'connecting…';

  return (
    <div className={cn('rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-fuchsia-200">
          <Radio className={cn('h-3.5 w-3.5', connected && 'text-emerald-400')} />
          Twin runtime {liveLabel}
          {heartbeats > 0 ? (
            <span className="font-normal text-white/40">· {heartbeats} heartbeat</span>
          ) : null}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('3d')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px]',
              view === '3d' ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-white/45 hover:text-white/70',
            )}
          >
            <Box className="h-3 w-3" />
            3D
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px]',
              view === 'map' ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-white/45 hover:text-white/70',
            )}
          >
            <Map className="h-3 w-3" />
            Hartă
          </button>
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
      </div>

      {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}

      {feed ? (
        <>
          {view === '3d' ? (
            <Twin3DViewer
              capacityKwp={feed.system.capacity_kwp}
              suitabilityScore={feed.system.suitability_score}
              className="mt-2"
            />
          ) : (
            <TwinMapViewer
              latitude={feed.site.latitude}
              longitude={feed.site.longitude}
              className="mt-2"
            />
          )}
          <p className="mt-2 text-[11px] text-white/65">
            {feed.site.client_name} · {feed.site.city} · {twinFeedMapLabel(feed.site.latitude, feed.site.longitude)}
          </p>
          <p className="text-[11px] text-white/55">
            {feed.system.capacity_kwp} kWp · scor {feed.system.suitability_score}/100
          </p>
        </>
      ) : !error ? (
        <p className="mt-2 text-[11px] text-white/40">Se încarcă stream SSE persistent…</p>
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