import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

function canUseWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl', { powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl', { powerPreference: 'high-performance' });
    return Boolean(gl && typeof (gl as WebGLRenderingContext).getParameter === 'function');
  } catch {
    return false;
  }
}

function readDeviceSignals(): {
  cores: number | null;
  deviceMemory: number | null;
  saveData: boolean;
} {
  if (typeof navigator === 'undefined') return { cores: null, deviceMemory: null, saveData: false };
  const navAny = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = typeof navAny.hardwareConcurrency === 'number' ? navAny.hardwareConcurrency : null;
  const deviceMemory = typeof navAny.deviceMemory === 'number' ? navAny.deviceMemory : null;
  const saveData = navAny.connection?.saveData === true;
  return { cores, deviceMemory, saveData };
}

function computeEligible(reducedMotion: boolean): boolean {
  if (typeof window === 'undefined') return false;
  if (reducedMotion) return false;

  const mql = window.matchMedia?.('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  if (!mql?.matches) return false;

  const { cores, deviceMemory, saveData } = readDeviceSignals();
  if (saveData) return false;
  if (cores !== null && cores < 4) return false;
  if (deviceMemory !== null && deviceMemory < 4) return false;

  return canUseWebGL();
}

export function useDesktop3DEligible(): boolean {
  const reducedMotion = useReducedMotion();
  const [eligible, setEligible] = useState<boolean>(() => computeEligible(reducedMotion));

  useEffect(() => {
    setEligible(computeEligible(reducedMotion));

    const mql = window.matchMedia?.('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
    if (!mql) return;
    const handler = () => setEligible(computeEligible(reducedMotion));
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [reducedMotion]);

  return eligible;
}

