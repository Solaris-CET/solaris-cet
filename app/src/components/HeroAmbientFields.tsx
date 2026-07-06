import { memo, useId } from 'react';

/**
 * Perspective grid + soft aurora wash — adds depth without extra JS weight.
 * IDs are unique per mount (React useId) for SVG defs.
 */
function HeroAmbientFields() {
  const uid = useId().replace(/:/g, '');
  const gridPat = `hero-grid-${uid}`;
  const washGrad = `hero-wash-${uid}`;
  const vignette = `hero-vig-${uid}`;

  return (
    <div
      className="absolute inset-0 z-[1] pointer-events-none overflow-hidden motion-reduce:opacity-40"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full text-amber-400/[0.14] motion-safe:animate-hero-mesh-shift sm:text-amber-400/[0.18]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={gridPat} width="56" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M56 0H0V56"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.55"
              opacity="0.55"
            />
            <path d="M0 0h56v56H0z" fill="none" stroke="currentColor" strokeWidth="0.22" opacity="0.35" />
          </pattern>
          <linearGradient id={washGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(242,201,76,0.11)" />
            <stop offset="42%" stopColor="rgba(46,231,255,0.05)" />
            <stop offset="100%" stopColor="rgba(2,6,23,0)" />
          </linearGradient>
          <radialGradient id={vignette} cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="rgba(2,6,23,0)" />
            <stop offset="72%" stopColor="rgba(2,6,23,0.55)" />
            <stop offset="100%" stopColor="rgba(2,6,23,0.92)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridPat})`} />
        <rect width="100%" height="100%" fill={`url(#${washGrad})`} opacity="0.85" />
        <rect width="100%" height="100%" fill={`url(#${vignette})`} />
      </svg>
    </div>
  );
}

export default memo(HeroAmbientFields);
