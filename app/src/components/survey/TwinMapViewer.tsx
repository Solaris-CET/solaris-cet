import { useMemo } from 'react';

import { twinFeedMapLabel, twinFeedMapUrl } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

const LABELS = {
  unavailable: 'Hartă indisponibilă — lipsă coordonate GPS',
  mapTitle: 'Hartă site twin',
  mapDesc: 'Hartă OpenStreetMap cu locația șantierului',
} as const;

export type TwinMapViewerProps = {
  latitude: number | null;
  longitude: number | null;
  className?: string;
};

function buildEmbedUrl(mapUrl: string): string {
  return mapUrl.replace('www.openstreetmap.org/?', 'www.openstreetmap.org/export/embed.html?');
}

export function TwinMapViewer({ latitude, longitude, className }: TwinMapViewerProps) {
  const mapUrl = useMemo(() => twinFeedMapUrl(latitude, longitude), [latitude, longitude]);
  const embedUrl = useMemo(() => (mapUrl ? buildEmbedUrl(mapUrl) : null), [mapUrl]);
  const locationLabel = useMemo(
    () => twinFeedMapLabel(latitude, longitude),
    [latitude, longitude],
  );

  if (!embedUrl) {
    return (
      <div
        className={cn(
          'rounded-lg border border-white/10 bg-black/30 px-3 py-6 text-center text-xs text-white/45',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        {LABELS.unavailable}
      </div>
    );
  }

  return (
    <figure className={cn('w-full', className)} aria-label={LABELS.mapTitle}>
      <iframe
        title={LABELS.mapTitle}
        src={embedUrl}
        className="h-40 w-full rounded-lg border border-white/10 bg-black/20"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <figcaption className="sr-only">
        {LABELS.mapDesc}: {locationLabel}
      </figcaption>
    </figure>
  );
}