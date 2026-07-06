import { type ReactNode,useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { cn } from '../lib/utils';

export type ScrollFadeUpProps = {
  children: ReactNode;
  className?: string;
  /** Fraction of the element that must be visible (0–1). */
  threshold?: number | number[];
  /** Passed to IntersectionObserver; e.g. trigger slightly before full entry. */
  rootMargin?: string;
};

/**
 * Fade-up on scroll: opacity 0→1 and translate from below when the block enters the viewport.
 * Respects `prefers-reduced-motion` (shows content immediately without transition).
 */
export function ScrollFadeUp({
  children,
  className,
  threshold = 0.15,
  rootMargin = '0px 0px -6% 0px',
}: ScrollFadeUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const prevRmRef = useRef(prefersReducedMotion);
  const [disableMotion, setDisableMotion] = useState(false);
  /** Intersection-driven visibility; ignored when `prefersReducedMotion` (always shown). */
  const [scrollVisible, setScrollVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setDisableMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const wasReducedMotion = prevRmRef.current;
    prevRmRef.current = prefersReducedMotion;

    if (prefersReducedMotion || disableMotion) return;

    const el = ref.current;
    if (!el) return;

    // Leaving reduced-motion: clear stale intersection so fade-up can run again. Scheduled
    // as a microtask so it runs before the observer's first callback (also async), and
    // setState stays off the synchronous effect body (react-hooks/set-state-in-effect).
    if (wasReducedMotion) {
      const applyReset = () => setScrollVisible(false);
      queueMicrotask(applyReset);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setScrollVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion, disableMotion, threshold, rootMargin]);

  const visible = prefersReducedMotion || disableMotion || scrollVisible;

  return (
    <div
      ref={ref}
      className={cn(
        !prefersReducedMotion &&
          !disableMotion &&
          'transition-[opacity,transform] duration-600 ease-out',
        visible && !prefersReducedMotion && !disableMotion ? 'solaris-fog-reveal' : '',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]',
        className
      )}
    >
      {children}
    </div>
  );
}
