import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

/**
 * Props accepted by {@link AnimatedCounter}.
 */
interface AnimatedCounterProps {
  /** The final numeric value the counter animates toward. */
  end: number;
  /** Animation duration in seconds (default: `2`). */
  duration?: number;
  /** Text appended after the formatted number, e.g. `'%'` or `' CET'`. */
  suffix?: string;
  /** Text prepended before the formatted number, e.g. `'$'`. */
  prefix?: string;
  /** Number of decimal places shown during and after the animation (default: `0`). */
  decimals?: number;
  /** Additional Tailwind/CSS class names applied to the `<span>`. */
  className?: string;
  /**
   * When `true`, the animation starts immediately on mount instead of waiting
   * for the element to enter the viewport (default: `false`).
   */
  triggerOnMount?: boolean;
}

/**
 * AnimatedCounter — a GSAP-powered numeric counter that animates from 0 to
 * {@link AnimatedCounterProps.end} using `power2.out` easing.
 *
 * By default the animation is deferred until the element is at least 30 %
 * visible in the viewport (via `IntersectionObserver`). Set
 * `triggerOnMount={true}` to start immediately.
 *
 * The value is formatted with `Number.toLocaleString('en-US')` and supports
 * an optional prefix/suffix and configurable decimal places.
 *
 * @param props - {@link AnimatedCounterProps}
 * @returns A `<span>` whose text content is updated on every GSAP tick.
 *
 * @example
 * ```tsx
 * <AnimatedCounter end={9000} suffix=" CET" />
 * <AnimatedCounter end={74} suffix="x" decimals={0} />
 * ```
 */
const AnimatedCounter = ({
  end,
  duration = 2,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  triggerOnMount = false,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ val: 0 });
  const [isVisible, setIsVisible] = useState(triggerOnMount);

  useEffect(() => {
    if (triggerOnMount) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggerOnMount]);

  useEffect(() => {
    if (!isVisible) return;

    const tween = gsap.to(proxy.current, {
      val: end,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          const val = proxy.current.val;
          ref.current.textContent = `${prefix}${val.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}${suffix}`;
        }
      },
    });

    return () => { tween.kill(); };
  }, [isVisible, end, duration, suffix, prefix, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
};

export default AnimatedCounter;
