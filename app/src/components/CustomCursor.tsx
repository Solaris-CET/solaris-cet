import { useEffect, useMemo, useRef, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

function shouldEnableFromUrl(): boolean {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('cursor') === '1';
  } catch {
    return false;
  }
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem('solaris_custom_cursor') === '1';
  } catch {
    return false;
  }
}

function persistEnabled(v: boolean): void {
  try {
    localStorage.setItem('solaris_custom_cursor', v ? '1' : '0');
  } catch {
    void 0;
  }
}

export default function CustomCursor() {
  const prefersReducedMotion = useReducedMotion();
  const enableViaUrl = useMemo(() => (typeof window === 'undefined' ? false : shouldEnableFromUrl()), []);
  const [enabled] = useState(() => (typeof window === 'undefined' ? false : readEnabled() || enableViaUrl));
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const targetRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enableViaUrl) return;
    persistEnabled(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('cursor');
      window.history.replaceState(null, '', url.toString());
    } catch {
      void 0;
    }
  }, [enableViaUrl]);

  useEffect(() => {
    if (!enabled) return;
    if (prefersReducedMotion) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (e: PointerEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const onDown = () => {
      ringRef.current?.setAttribute('data-down', '1');
      dotRef.current?.setAttribute('data-down', '1');
    };

    const onUp = () => {
      ringRef.current?.removeAttribute('data-down');
      dotRef.current?.removeAttribute('data-down');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });

    const tick = () => {
      const pos = posRef.current;
      const target = targetRef.current;
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      const ring = ringRef.current;
      const dot = dotRef.current;
      if (ring) ring.style.transform = `translate3d(${pos.x - 16}px, ${pos.y - 16}px, 0)`;
      if (dot) dot.style.transform = `translate3d(${pos.x - 4}px, ${pos.y - 4}px, 0)`;
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, prefersReducedMotion]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!enabled) {
      document.documentElement.classList.remove('solaris-custom-cursor');
      return;
    }
    document.documentElement.classList.add('solaris-custom-cursor');
    return () => document.documentElement.classList.remove('solaris-custom-cursor');
  }, [enabled]);

  if (!enabled) return null;
  if (prefersReducedMotion) return null;

  return (
    <>
      <div ref={ringRef} className="solaris-cursor-ring" aria-hidden />
      <div ref={dotRef} className="solaris-cursor-dot" aria-hidden />
    </>
  );
}
