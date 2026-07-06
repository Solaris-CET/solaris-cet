import { useEffect } from 'react';

import { useReducedMotion } from './useReducedMotion';

/**
 * Intercepts any click on links staring with `#` and animates the scroll using GSAP,
 * ensuring high-performance smooth animations across all devices, overriding native snap behaviors.
 */
export function useSmoothAnchors() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.tagName.toLowerCase() === 'a' ? (target as HTMLAnchorElement) : target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;

      const destElement = document.querySelector(href);
      if (destElement) {
        e.preventDefault();

        const y = (destElement as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? 'auto' : 'smooth' });

        // Update URL hash without jumping
        if (window.history.pushState) {
          window.history.pushState(null, '', href);
        } else {
          window.location.hash = href;
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [prefersReducedMotion]);
}
