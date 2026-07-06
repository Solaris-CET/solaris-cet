import { ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { fetchTwinFeed } from '@/lib/surveyApi';
import type { TwinFeed } from '@/lib/twinFeed';
import { twinFeedMapLabel, twinFeedMapUrl } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

type Props = {
  reportId: string;
  className?: string;
};

export function TwinFeedPanel({ reportId, className }: Props) {
  const [feed, setFeed] = useState<TwinFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchTwinFeed(reportId);
      setFeed(data);
    } catch (err) {
      setFeed(null);
      setError(err instanceof Error ? err.message : 'Twin feed indisponibil');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const mapUrl = feed ? twinFeedMapUrl(feed.site.latitude, feed.site.longitude) : null;

  return (
    <div className={cn('rounded-xl border border-violet-400/20 bg-violet-400/5 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-violet-200">Digital Twin feed</p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          Reîmprospătează
        </button>
      </div>

      {error ? <p className="mt-2 text-[11px] text-red-300">{error}</p> : null}

      {feed ? (
        <div className="mt-2 space-y-2 text-[11px] text-white/65">
          <p>
            <span className="text-white/45">Site:</span>{' '}
            {feed.site.client_name} · {feed.site.city}
          </p>
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-violet-300/80" />
            {twinFeedMapLabel(feed.site.latitude, feed.site.longitude)}
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 text-violet-300 hover:underline"
              >
                Hartă <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}
          </p>
          <p>
            <span className="text-white/45">Sistem:</span>{' '}
            {feed.system.capacity_kwp} kWp · scor {feed.system.suitability_score}/100
          </p>
          {feed.low_confidence_count > 0 ? (
            <p className="text-amber-300">
              {feed.low_confidence_count} finding(uri) cu încredere scăzută
            </p>
          ) : null}
          {feed.corrections_count > 0 ? (
            <p className="text-teal-300">{feed.corrections_count} corecții tehnician</p>
          ) : null}
          <p className="font-mono text-[10px] text-white/35">{feed.schema} v{feed.feed_version}</p>
        </div>
      ) : !loading && !error ? (
        <p className="mt-2 text-[11px] text-white/40">Se încarcă feed-ul twin...</p>
      ) : null}
    </div>
  );
}