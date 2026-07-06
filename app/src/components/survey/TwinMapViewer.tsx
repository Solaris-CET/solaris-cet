import { twinFeedMapUrl } from '@/lib/twinFeedMap';
import { cn } from '@/lib/utils';

type Props = {
  latitude: number | null;
  longitude: number | null;
  className?: string;
};

export function TwinMapViewer({ latitude, longitude, className }: Props) {
  const mapUrl = twinFeedMapUrl(latitude, longitude);
  if (!mapUrl) {
    return (
      <div className={cn('rounded-lg border border-white/10 bg-black/30 px-3 py-6 text-center text-xs text-white/45', className)}>
        Hartă indisponibilă — lipsă coordonate GPS
      </div>
    );
  }
  const embed = mapUrl.replace('www.openstreetmap.org/?', 'www.openstreetmap.org/export/embed.html?');
  return (
    <iframe
      title="Twin site map"
      src={embed}
      className={cn('h-40 w-full rounded-lg border border-white/10 bg-black/20', className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}