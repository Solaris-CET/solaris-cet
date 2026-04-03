import { memo } from 'react';
import { cn } from '@/lib/utils';

const LOGO_SRC = `${import.meta.env.BASE_URL}solaris-cet-logo.jpg`;

export type SolarisLogoMarkProps = {
  className?: string;
  /** When true (default), mark is paired with visible “Solaris CET” copy elsewhere. */
  decorative?: boolean;
  /**
   * `full` — full lockup (icon + wordmark). `emblem` — square crop on the circular mark for icon slots.
   */
  crop?: 'full' | 'emblem';
  /** Above-the-fold / LCP: eager load + high fetch priority. */
  priority?: boolean;
};

/**
 * Solaris CET brand lockup (high-res raster) with cinematic holographic treatment:
 * chromatic-style glow drift, scanlines, and soft-light sheen — gated for `prefers-reduced-motion`.
 */
function SolarisLogoMarkInner({
  className,
  decorative = true,
  crop = 'emblem',
  priority = false,
}: SolarisLogoMarkProps) {
  return (
    <span
      className={cn(
        'solaris-holo-logo',
        crop === 'emblem' && 'h-full w-full overflow-hidden rounded-[inherit]',
        className,
      )}
      aria-hidden={decorative}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Solaris CET'}
    >
      <span className="solaris-holo-fx" aria-hidden>
        <span className="solaris-holo-scanlines" />
        <span className="solaris-holo-sheen" />
      </span>
      <img
        src={LOGO_SRC}
        alt=""
        width={687}
        height={1024}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        draggable={false}
        className={cn('solaris-holo-img', crop === 'emblem' ? 'solaris-holo-img--emblem' : 'solaris-holo-img--full')}
      />
    </span>
  );
}

export const SolarisLogoMark = memo(SolarisLogoMarkInner);
