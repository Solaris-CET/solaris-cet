import { useEffect, useRef, useState } from 'react';

const RECONNECT_BASE_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const STABLE_RESET_MS = 60_000;

function computeBackoffDelay(attempt: number): number {
  const exponential = RECONNECT_BASE_MS * 2 ** attempt;
  const capped = Math.min(exponential, MAX_RECONNECT_DELAY_MS);
  const jitter = capped * 0.25 * Math.random();
  return Math.floor(capped + jitter);
}

export function usePresenceCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    let es: EventSource | null = null;
    let closed = false;

    const clearRetryTimer = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const clearStableTimer = () => {
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      clearRetryTimer();
      const delay = computeBackoffDelay(attemptRef.current);
      retryTimerRef.current = setTimeout(() => {
        if (closed) return;
        open();
      }, delay);
      attemptRef.current += 1;
    };

    const open = () => {
      if (closed) return;
      try {
        es = new EventSource('/api/realtime/presence');
        es.onopen = () => {
          attemptRef.current = 0;
          clearStableTimer();
          stableTimerRef.current = setTimeout(() => {
            attemptRef.current = 0;
          }, STABLE_RESET_MS);
        };
        es.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data) as { count?: unknown };
            const v = typeof parsed?.count === 'number' ? parsed.count : null;
            if (typeof v === 'number') setCount(v);
          } catch {
            // Ignore malformed SSE frames.
          }
        };
        es.onerror = () => {
          if (closed) return;
          try {
            es?.close();
          } catch {
            void 0;
          }
          es = null;
          scheduleReconnect();
        };
      } catch {
        es = null;
        scheduleReconnect();
      }
    };

    open();

    return () => {
      closed = true;
      clearRetryTimer();
      clearStableTimer();
      try {
        es?.close();
      } catch {
        void 0;
      }
      es = null;
    };
  }, [enabled]);

  return { count };
}
