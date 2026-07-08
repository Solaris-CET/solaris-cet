import { ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchTwinFeed } from '@/lib/surveyApi';
import type { TwinFeed } from '@/lib/twinFeed';
import { twinFeedMapLabel, twinFeedMapUrl } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

const LABELS = {
  title: 'Digital Twin feed',
  refresh: 'Reîmprospătează',
  refreshAria: 'Reîmprospătează feed-ul Digital Twin',
  loading: 'Se încarcă feed-ul twin...',
  site: 'Site:',
  system: 'Sistem:',
  map: 'Hartă',
  lowConfidence: (count: number) => `${count} finding(uri) cu încredere scăzută`,
  corrections: (count: number) => `${count} corecții tehnician`,
  panelAria: 'Panou feed Digital Twin pentru raportul curent',
} as const;

export type TwinFeedPanelProps = {
  reportId: string;
  className?: string;
};

export function TwinFeedPanel({ reportId, className }: TwinFeedPanelProps) {
  const [feed, setFeed] = useState<TwinFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!reportId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchTwinFeed(reportId);
      if (signal?.aborted) return;
      setFeed(data);
    } catch (err) {
      if (signal?.aborted) return;
      setFeed(null);
      setError(err instanceof Error ? err.message : 'Twin feed indisponibil');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const mapUrl = useMemo(
    () => (feed ? twinFeedMapUrl(feed.site.latitude, feed.site.longitude) : null),
    [feed],
  );
  const mapLabel = useMemo(
    () => (feed ? twinFeedMapLabel(feed.site.latitude, feed.site.longitude) : ''),
    [feed],
  );

  return (
    <section
      className={cn('rounded-xl border border-violet-400/20 bg-violet-400/5 p-3', className)}
      aria-label={LABELS.panelAria}
      aria-busy={loading}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="twin-feed-heading" className="text-xs font-semibold text-violet-200">
          {LABELS.title}
        </h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label={LABELS.refreshAria}
          className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} aria-hidden />
          {LABELS.refresh}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {feed ? (
        <div className="mt-2 space-y-2 text-[11px] text-white/65" aria-labelledby="twin-feed-heading">
          <p>
            <span className="text-white/45">{LABELS.site}</span>{' '}
            {feed.site.client_name} · {feed.site.city}
          </p>
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-violet-300/80" aria-hidden />
            {mapLabel}
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 text-violet-300 hover:underline"
                aria-label={`${LABELS.map} ${feed.site.city}`}
              >
                {LABELS.map} <ExternalLink className="h-2.5 w-2.5" aria-hidden />
              </a>
            ) : null}
          </p>
          <p>
            <span className="text-white/45">{LABELS.system}</span>{' '}
            {feed.system.capacity_kwp} kWp · scor {feed.system.suitability_score}/100
          </p>
          {feed.low_confidence_count > 0 ? (
            <p className="text-amber-300">{LABELS.lowConfidence(feed.low_confidence_count)}</p>
          ) : null}
          {feed.corrections_count > 0 ? (
            <p className="text-teal-300">{LABELS.corrections(feed.corrections_count)}</p>
          ) : null}
          <p className="font-mono text-[10px] text-white/35">
            {feed.schema} v{feed.feed_version}
          </p>
        </div>
      ) : !loading && !error ? (
        <p className="mt-2 text-[11px] text-white/40" role="status">
          {LABELS.loading}
        </p>
      ) : null}
    </section>
  );
}