import { useCallback, useEffect, useState } from 'react';

interface BatteryInfo {
  level: number;
  charging: boolean;
  note?: string;
}

interface MiningEfficiencyResult {
  isSuspended: boolean;
  getBatteryInfo: () => Promise<BatteryInfo>;
}

/**
 * useMiningEfficiency — suspends mining-related background work when the tab
 * is not visible (Page Visibility API) and provides a cross-platform battery
 * info helper that gracefully handles iOS, which blocks the Battery Status API.
 */
export function useMiningEfficiency(
  workerRef?: React.RefObject<Worker | null>
): MiningEfficiencyResult {
  const [isSuspended, setIsSuspended] = useState(() => document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsSuspended(hidden);

      if (workerRef?.current) {
        workerRef.current.postMessage({ type: hidden ? 'SUSPEND' : 'RESUME' });
      }

      try {
        localStorage.setItem('mining-status', hidden ? 'suspended' : 'active');
      } catch {
        // localStorage may be unavailable in private-browsing or restricted environments
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [workerRef]);

  const getBatteryInfo = useCallback(async (): Promise<BatteryInfo> => {
    if ('getBattery' in navigator) {
      try {
        // Battery Status API — available in Chrome/Android; blocked on iOS Safari
        const battery = await (navigator as Navigator & {
          getBattery: () => Promise<{ level: number; charging: boolean }>;
        }).getBattery();
        return { level: Math.round(battery.level * 100), charging: battery.charging };
      } catch {
        return { level: 100, charging: true, note: 'Battery API unavailable' };
      }
    }
    return { level: 100, charging: true, note: 'Battery API unavailable' };
  }, []);

  return { isSuspended, getBatteryInfo };
}
