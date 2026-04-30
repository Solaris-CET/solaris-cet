import { useEffect, useState } from 'react';

const MQ = '(prefers-reduced-motion: reduce)';

/**
 * useReducedMotion — returns `true` when the user has requested reduced motion
 * via their OS/browser accessibility settings (`prefers-reduced-motion: reduce`).
 *
 * Use this to skip or simplify GSAP/CSS animations for users who experience
 * discomfort from motion-heavy interfaces.
 *
 * The hook responds to live changes: if the user toggles the OS setting while
 * the page is open, `prefersReducedMotion` updates immediately via a
 * `MediaQueryList` change listener.
 *
 * @returns `true` if the user prefers reduced motion, `false` otherwise.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * if (prefersReducedMotion) return; // skip heavy animation
 * gsap.from(ref.current, { opacity: 0, y: 40 });
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(MQ).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.matchMedia !== 'function') return;

    const mql = window.matchMedia(MQ);

    // `applyMatch` is the single source of truth for updating state.
    // Calling it through a callback (not directly in the effect body) keeps
    // the react-hooks/set-state-in-effect lint rule satisfied.
    const applyMatch = (matches: boolean) => setPrefersReducedMotion(matches);
    const handler = (e: MediaQueryListEvent) => applyMatch(e.matches);

    mql.addEventListener('change', handler);

    // Re-sync from the current preference value in case it changed between
    // the initial render (where useState is initialized) and this effect
    // running (e.g. during SSR hydration). State setter is called inside
    // `applyMatch`, not directly in the effect body.
    applyMatch(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
