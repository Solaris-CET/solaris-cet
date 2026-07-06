import { cn } from '@/lib/utils';

type ChartLazyFallbackProps = {
  className?: string;
};

/** Placeholder while a lazy-loaded Recharts bundle downloads (viewport / scroll gated). */
export function ChartLazyFallback({ className }: ChartLazyFallbackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[240px] sm:min-h-[280px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-solaris-muted text-sm',
        className,
      )}
    >
      <span className="sr-only">Loading chart</span>
      <span aria-hidden className="h-2 w-24 rounded-full bg-white/10 motion-safe:animate-pulse" />
    </div>
  );
}
