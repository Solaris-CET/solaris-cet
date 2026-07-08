import { Activity, Layers, MapPin, Radio, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTwinStream } from '@/hooks/useTwinStream';
import { twinFeedMapLabel } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

import { Twin3DViewer } from './Twin3DViewer';
import { TwinMapViewer } from './TwinMapViewer';

const LABELS = {
  title: 'Twin runtime',
  live: 'live',
  connecting: 'connecting…',
  heartbeats: (count: number) => `· ${count} heartbeat`,
  view3d: '3D',
  viewMap: 'Hartă',
  reconnect: 'Reconnect',
  reconnectAria: 'Reconectează stream-ul Twin runtime',
  view3dAria: 'Afișează vizualizarea 3D',
  viewMapAria: 'Afișează harta site-ului',
  loading: 'Se încarcă stream SSE persistent…',
  panelAria: 'Panou runtime Digital Twin cu stream live',
} as const;

const MAX_VISIBLE_EVENTS = 5;

export type TwinRuntimePanelProps = {
  reportId: string;
  className?: string;
};

export type TwinRuntimeViewMode = 'map' | '3d';

function liveStatusLabel(connected: boolean, ready: boolean, heartbeats: number): string {
  return connected && (ready || heartbeats > 0) ? LABELS.live : LABELS.connecting;
}

export function TwinRuntimePanel({ reportId, className }: TwinRuntimePanelProps) {
  const { feed, events, ready, connected, heartbeats, error, loading, reconnect } = useTwinStream(reportId);
  const [view, setView] = useState<TwinRuntimeViewMode>('3d');
  const liveLabel = liveStatusLabel(connected, ready, heartbeats);
  const visibleEvents = useMemo(() => events.slice(0, MAX_VISIBLE_EVENTS), [events]);
  const locationLabel = useMemo(
    () => (feed ? twinFeedMapLabel(feed.site.latitude, feed.site.longitude) : ''),
    [feed],
  );

  return (
    <section
      className={cn('rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-3', className)}
      aria-label={LABELS.panelAria}
      aria-busy={loading}
    >
      <div className="flex items-center justify-between gap-2">
        <p id="twin-runtime-heading" className="inline-flex items-center gap-1.5 text-xs font-semibold text-fuchsia-200">
          <Radio className={cn('h-3.5 w-3.5', connected && 'text-emerald-400')} aria-hidden />
          {LABELS.title} {liveLabel}
          {heartbeats > 0 ? (
            <span className="font-normal text-white/40">{LABELS.heartbeats(heartbeats)}</span>
          ) : null}
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="Mod vizualizare Twin">
          <button
            type="button"
            onClick={() => setView('3d')}
            aria-pressed={view === '3d'}
            aria-label={LABELS.view3dAria}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px]',
              view === '3d' ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-white/45 hover:text-white/70',
            )}
          >
            <Layers className="h-3 w-3" aria-hidden />
            {LABELS.view3d}
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            aria-pressed={view === 'map'}
            aria-label={LABELS.viewMapAria}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px]',
              view === 'map' ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-white/45 hover:text-white/70',
            )}
          >
            <MapPin className="h-3 w-3" aria-hidden />
            {LABELS.viewMap}
          </button>
          <button
            type="button"
            onClick={() => void reconnect()}
            disabled={loading}
            aria-label={LABELS.reconnectAria}
            className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} aria-hidden />
            {LABELS.reconnect}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {feed ? (
        <div aria-labelledby="twin-runtime-heading">
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
            {feed.site.client_name} · {feed.site.city} · {locationLabel}
          </p>
          <p className="text-[11px] text-white/55">
            {feed.system.capacity_kwp} kWp · scor {feed.system.suitability_score}/100
          </p>
        </div>
      ) : !error ? (
        <p className="mt-2 text-[11px] text-white/40" role="status">
          {LABELS.loading}
        </p>
      ) : null}

      {visibleEvents.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-white/10 pt-2" aria-label="Evenimente Twin recente">
          {visibleEvents.map((ev) => (
            <li key={ev.event_id} className="flex items-center gap-2 text-[10px] text-white/50">
              <Activity className="h-3 w-3 text-fuchsia-300/70" aria-hidden />
              <span className="font-mono text-fuchsia-200/80">{ev.event_type}</span>
              <time dateTime={ev.timestamp}>{new Date(ev.timestamp).toLocaleTimeString('ro-RO')}</time>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}