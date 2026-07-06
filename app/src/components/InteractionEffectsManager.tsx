import { useEffect } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

const RIPPLE_SELECTOR = '.btn-gold, .btn-filled-gold, .ton-connect-btn button';

function createRipple(target: HTMLElement, clientX: number, clientY: number) {
  if (target.getAttribute('data-ripple') === 'off') return;
  const rect = target.getBoundingClientRect();
  const sizePx = Math.max(rect.width, rect.height) * 1.35;
  const x = clientX - rect.left - sizePx / 2;
  const y = clientY - rect.top - sizePx / 2;

  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  ink.style.width = `${sizePx}px`;
  ink.style.height = `${sizePx}px`;
  ink.style.left = `${x}px`;
  ink.style.top = `${y}px`;

  target.querySelectorAll('.ripple-ink').forEach((node) => node.remove());
  target.appendChild(ink);
  window.setTimeout(() => ink.remove(), 650);
}

export function InteractionEffectsManager() {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const options: AddEventListenerOptions = { capture: true };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rawTarget = event.target as HTMLElement | null;
      if (!rawTarget) return;
      if (rawTarget.closest('[data-slot="button"]')) return;
      const target = rawTarget.closest(RIPPLE_SELECTOR) as HTMLElement | null;
      if (!target) return;
      createRipple(target, event.clientX, event.clientY);
    };

    document.addEventListener('pointerdown', onPointerDown, options);
    return () => document.removeEventListener('pointerdown', onPointerDown, options);
  }, [prefersReducedMotion]);

  return null;
}
