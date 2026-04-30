import { useEffect, useRef } from 'react';

import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * CursorGlow — a fixed-position radial-gradient spotlight that follows the
 * mouse cursor using linear interpolation (lerp factor 0.1) for a smooth lag
 * effect. Rendered with `mix-blend-mode: screen` so it blends additively over
 * dark backgrounds. Hidden on touch devices via CSS (`@media (max-width: 640px)`).
 *
 * @returns A decorative `div` that tracks the cursor. Marked `aria-hidden` so
 *   it is invisible to assistive technologies.
 */
const CursorGlow = () => {
  const prefersReducedMotion = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -300, y: -300 });
  const targetRef = useRef({ x: -300, y: -300 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    // Skip runtime work when device has no fine pointer (touch-first/coarse).
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      const pos = posRef.current;
      const target = targetRef.current;

      // Lerp toward cursor
      pos.x += (target.x - pos.x) * 0.1;
      pos.y += (target.y - pos.y) * 0.1;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.x - 300}px, ${pos.y - 300}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={glowRef}
      className="cursor-glow"
      aria-hidden="true"
    />
  );
};

export default CursorGlow;
