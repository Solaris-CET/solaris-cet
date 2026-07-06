import { useEffect, useRef,useState } from 'react';

interface UseIntersectionObserverOptions {
  /** Fraction of the element that must be visible to trigger (default: `0.1`). */
  threshold?: number;
  /** Margin around the root element (default: `'0px'`). */
  rootMargin?: string;
  /**
   * When `true`, the observer disconnects once the element becomes visible so
   * the visibility state never reverts to `false` (default: `true`).
   */
  freezeOnceVisible?: boolean;
}

/**
 * Observes whether a DOM element is within the viewport.
 *
 * Returns an `{ elementRef, isVisible }` tuple. Attach `elementRef` to the
 * element you want to observe. `isVisible` becomes `true` once the element
 * meets the intersection threshold.
 *
 * @example
 * ```tsx
 * const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.2 });
 * return <div ref={elementRef}>{isVisible && <HeavyComponent />}</div>;
 * ```
 */
export function useIntersectionObserver<T extends Element = Element>({
  threshold = 0.1,
  rootMargin = '0px',
  freezeOnceVisible = true,
}: UseIntersectionObserverOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsVisible(entry.isIntersecting);
          if (freezeOnceVisible && entry.isIntersecting) {
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, freezeOnceVisible, isVisible]);

  return { elementRef, isVisible };
}
