import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { useReducedMotion } from '../hooks/useReducedMotion';

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
  threshold = 0.12,
  rootMargin = '0px 0px -6% 0px',
}: ScrollFadeUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  /** Intersection-driven visibility; ignored when `prefersReducedMotion` (always shown). */
  const [scrollVisible, setScrollVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

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
  }, [prefersReducedMotion, threshold, rootMargin]);

  const visible = prefersReducedMotion || scrollVisible;

  return (
    <div
      ref={ref}
      className={cn(
        !prefersReducedMotion &&
          'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}
