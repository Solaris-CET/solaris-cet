import { memo, useCallback, useId, useState } from 'react';
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

/** Legacy vector mark — shown if `solaris-cet-logo.jpg` fails to load (missing asset, network, CSP). */
function SolarisVectorFallback({
  crop,
  decorative,
}: {
  crop: 'full' | 'emblem';
  decorative: boolean;
}) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gGold = `sg${rid}`;
  const gCyan = `sc${rid}`;
  const gVoid = `sv${rid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      className={cn('solaris-holo-img', crop === 'emblem' ? 'solaris-holo-img--emblem' : 'solaris-holo-img--full')}
      focusable="false"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Solaris CET'}
    >
      <defs>
        <linearGradient id={gGold} x1="6" y1="10" x2="58" y2="54">
          <stop stopColor="#FFF8E7" />
          <stop offset="0.35" stopColor="#F2C94C" />
          <stop offset="1" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id={gCyan} x1="4" y1="60" x2="60" y2="4">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0891B2" />
        </linearGradient>
        <radialGradient id={gVoid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" stroke={`url(#${gGold})`} strokeWidth="2.25" />
      <circle cx="32" cy="32" r="23.5" stroke={`url(#${gCyan})`} strokeWidth="1.35" opacity={0.88} />
      <circle cx="32" cy="32" r="18.5" fill={`url(#${gVoid})`} />
      <g stroke={`url(#${gGold})`} strokeWidth="1.4" strokeLinecap="round" opacity={0.82}>
        <line x1="32" y1="14" x2="32" y2="20" />
        <line x1="32" y1="44" x2="32" y2="50" />
        <line x1="14" y1="32" x2="20" y2="32" />
        <line x1="44" y1="32" x2="50" y2="32" />
        <line x1="19.2" y1="19.2" x2="23.5" y2="23.5" />
        <line x1="40.5" y1="40.5" x2="44.8" y2="44.8" />
        <line x1="44.8" y1="19.2" x2="40.5" y2="23.5" />
        <line x1="23.5" y1="40.5" x2="19.2" y2="44.8" />
      </g>
      <circle cx="32" cy="32" r="5.2" fill={`url(#${gGold})`} />
      <circle cx="32" cy="32" r="2.1" fill="#020617" opacity={0.35} />
    </svg>
  );
}

/**
 * Solaris CET brand lockup (high-res raster) with cinematic holographic treatment.
 * Falls back to an inline vector mark if the raster asset is missing or fails to load.
 */
function SolarisLogoMarkInner({
  className,
  decorative = true,
  crop = 'emblem',
  priority = false,
}: SolarisLogoMarkProps) {
  const [rasterFailed, setRasterFailed] = useState(false);
  const handleRasterError = useCallback(() => {
    setRasterFailed(true);
  }, []);

  const imgAlt = decorative ? '' : 'Solaris CET';

  return (
    <span
      className={cn(
        'solaris-holo-logo',
        crop === 'emblem' && 'h-full w-full overflow-hidden rounded-[inherit]',
        crop === 'full' && 'min-h-0 min-w-0 max-w-full',
        className,
      )}
      aria-hidden={decorative ? true : undefined}
    >
      <span className="solaris-holo-fx" aria-hidden>
        <span className="solaris-holo-scanlines" />
        <span className="solaris-holo-sheen" />
      </span>
      {rasterFailed ? (
        <SolarisVectorFallback crop={crop} decorative={decorative} />
      ) : (
        <img
          src={LOGO_SRC}
          alt={imgAlt}
          width={687}
          height={1024}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          draggable={false}
          onError={handleRasterError}
          className={cn('solaris-holo-img', crop === 'emblem' ? 'solaris-holo-img--emblem' : 'solaris-holo-img--full')}
        />
      )}
    </span>
  );
}

export const SolarisLogoMark = memo(SolarisLogoMarkInner);
