import { useEffect, useRef } from 'react';

type TiltOptions = {
  maxDeg?: number;
  perspective?: number;
};

export function useTiltCard(opts: TiltOptions = {}) {
  const { maxDeg = 8, perspective = 600 } = opts;
  const ref = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const apply = () => {
      reduceMotionRef.current = Boolean(mql?.matches);
    };
    apply();
    mql?.addEventListener?.('change', apply);
    return () => mql?.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reset = () => {
      el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    };

    reset();

    if (reduceMotionRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)')?.matches) return;

    let last: { x: number; y: number } | null = null;

    const update = () => {
      rafRef.current = 0;
      if (!last) return;

      const rect = el.getBoundingClientRect();
      const px = (last.x - rect.left) / rect.width;
      const py = (last.y - rect.top) / rect.height;
      const clampedX = Math.max(0, Math.min(1, px));
      const clampedY = Math.max(0, Math.min(1, py));

      const ry = (clampedX - 0.5) * (maxDeg * 2);
      const rx = (0.5 - clampedY) * (maxDeg * 2);

      el.style.transform = `perspective(${perspective}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(
        2,
      )}deg) translateZ(0)`;
    };

    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    const onLeave = () => {
      last = null;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      reset();
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [maxDeg, perspective]);

  return ref;
}
