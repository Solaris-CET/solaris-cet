import { useEffect, useRef, useState } from 'react';

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const;

/**
 * Fires once when the classic Konami sequence is completed (keyboard).
 */
export function useKonami(onUnlock: () => void, enabled = true) {
  const idxRef = useRef(0);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    if (!enabled) {
      idxRef.current = 0;
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const expected = SEQUENCE[idxRef.current];
      if (e.code === expected) {
        idxRef.current += 1;
        if (idxRef.current >= SEQUENCE.length) {
          idxRef.current = 0;
          onUnlockRef.current();
        }
      } else {
        idxRef.current = e.code === SEQUENCE[0] ? 1 : 0;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** Same hook but returns [unlocked, reset] for UI that owns state. */
export function useKonamiState(enabled = true) {
  const [unlocked, setUnlocked] = useState(false);

  useKonami(() => setUnlocked(true), enabled);

  const reset = () => setUnlocked(false);
  return { unlocked, reset };
}
