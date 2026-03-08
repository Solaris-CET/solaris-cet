/**
 * Props accepted by {@link GlowOrbs}.
 */
interface GlowOrbsProps {
  /**
   * Colour palette for the ambient orbs.
   * - `'gold'`  — two warm-gold orbs
   * - `'cyan'`  — two cool-cyan orbs
   * - `'mixed'` — three orbs with both gold and cyan tones (default)
   */
  variant?: 'gold' | 'cyan' | 'mixed';
  /** Additional Tailwind/CSS class names applied to the wrapper. */
  className?: string;
}

/**
 * GlowOrbs — decorative ambient light blobs rendered as blurred radial
 * gradients, continuously animated with the `animate-orb-pulse` keyframe.
 * Each orb is absolutely positioned inside a full-size, pointer-events-none
 * container so it does not interfere with interactive elements.
 *
 * @param props - {@link GlowOrbsProps}
 * @returns A `div` containing the configured orb elements. Marked `aria-hidden`.
 */
const GlowOrbs = ({ variant = 'mixed', className = '' }: GlowOrbsProps) => {
  const orbs =
    variant === 'gold'
      ? [
          { color: 'rgba(242,201,76,0.12)', size: 400, x: '20%', y: '30%', delay: '0s' },
          { color: 'rgba(242,201,76,0.07)', size: 300, x: '75%', y: '60%', delay: '2s' },
        ]
      : variant === 'cyan'
      ? [
          { color: 'rgba(46,231,255,0.10)', size: 360, x: '65%', y: '25%', delay: '1s' },
          { color: 'rgba(46,231,255,0.06)', size: 280, x: '15%', y: '65%', delay: '3s' },
        ]
      : [
          { color: 'rgba(242,201,76,0.10)', size: 420, x: '15%', y: '40%', delay: '0s' },
          { color: 'rgba(46,231,255,0.08)', size: 320, x: '70%', y: '25%', delay: '1.5s' },
          { color: 'rgba(242,201,76,0.06)', size: 260, x: '50%', y: '75%', delay: '3s' },
        ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-orb-pulse"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animationDelay: orb.delay,
            filter: 'blur(40px)',
          }}
        />
      ))}
    </div>
  );
};

export default GlowOrbs;
