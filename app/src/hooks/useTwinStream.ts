import { useCallback, useEffect, useRef, useState } from 'react';

import { twinStreamUrl } from '@/lib/twinRuntimeApi';
import type { TwinEvent, TwinStreamMessage } from '@/lib/twinRuntime';
import type { TwinFeed } from '@/lib/twinFeed';

type State = {
  feed: TwinFeed | null;
  events: TwinEvent[];
  ready: boolean;
  connected: boolean;
  heartbeats: number;
  error: string;
  loading: boolean;
};

const INITIAL: State = {
  feed: null,
  events: [],
  ready: false,
  connected: false,
  heartbeats: 0,
  error: '',
  loading: false,
};

const RECONNECT_BASE_MS = 1500;
const MAX_RECONNECT_ATTEMPTS = 8;
const STABLE_CONNECTION_RESET_MS = 60_000;

function parseSseChunk(raw: string): TwinStreamMessage | null {
  let eventType = 'message';
  let dataLine = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim();
    if (line.startsWith('data:')) dataLine = line.slice(5).trim();
  }
  if (!dataLine) return null;
  try {
    const data = JSON.parse(dataLine) as Record<string, unknown>;
    if (eventType === 'snapshot') return { type: 'snapshot', feed: data as unknown as TwinFeed };
    if (eventType === 'ready') return { type: 'ready', reportId: String(data.report_id ?? '') };
    if (eventType === 'heartbeat') return { type: 'heartbeat', reportId: String(data.report_id ?? '') };
    if (eventType === 'error') return { type: 'error', message: String(data.error ?? 'Twin stream error') };
    return { type: 'event', event: data as unknown as TwinEvent };
  } catch {
    return null;
  }
}

function applyMessage(s: State, msg: TwinStreamMessage): State {
  if (msg.type === 'snapshot') {
    return { ...s, feed: msg.feed, loading: false, connected: true };
  }
  if (msg.type === 'event') {
    const events = [msg.event, ...s.events].slice(0, 20);
    return { ...s, events, loading: false, connected: true };
  }
  if (msg.type === 'ready') {
    return { ...s, ready: true, loading: false, connected: true };
  }
  if (msg.type === 'heartbeat') {
    return { ...s, heartbeats: s.heartbeats + 1, connected: true, loading: false };
  }
  if (msg.type === 'error') {
    return { ...s, error: msg.message, loading: false, connected: false };
  }
  return s;
}

function computeReconnectDelay(attempt: number): number {
  const exponential = RECONNECT_BASE_MS * 2 ** attempt;
  const capped = Math.min(exponential, 30_000);
  const jitter = capped * 0.25 * Math.random();
  return Math.floor(capped + jitter);
}

export function useTwinStream(reportId: string | null, options?: { persistent?: boolean }) {
  const persistent = options?.persistent !== false;
  const [state, setState] = useState<State>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => Promise<void>) | null>(null);

  const scheduleReconnect = useCallback((delay: number) => {
    reconnectTimerRef.current = setTimeout(() => {
      void connectRef.current?.();
    }, delay);
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearStableTimer = useCallback(() => {
    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!reportId) return;
    abortRef.current?.abort();
    clearReconnectTimer();
    clearStableTimer();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true, error: '', ready: false }));

    try {
      const res = await fetch(twinStreamUrl(reportId, persistent), { signal: controller.signal });
      if (!res.ok || !res.body) {
        throw new Error(`Twin stream HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        let done: boolean;
        let value: Uint8Array | undefined;
        try {
          const readResult = await reader.read();
          done = readResult.done;
          value = readResult.value;
        } catch (readErr) {
          if (controller.signal.aborted) return;
          throw readErr;
        }
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const chunk of parts) {
          const msg = parseSseChunk(chunk);
          if (!msg) continue;
          setState((s) => applyMessage(s, msg));
        }
      }

      setState((s) => ({ ...s, loading: false, connected: persistent ? s.connected : true }));
      reconnectAttemptRef.current = 0;

      if (persistent && !controller.signal.aborted) {
        // Reset attempt counter after a stable connection period.
        stableTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current = 0;
        }, STABLE_CONNECTION_RESET_MS);
        scheduleReconnect(RECONNECT_BASE_MS);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Twin stream eșuat';
      setState((s) => ({ ...s, loading: false, error: message, connected: false }));

      if (persistent && reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current += 1;
        scheduleReconnect(computeReconnectDelay(attempt));
      }
    }
  }, [reportId, persistent, scheduleReconnect, clearReconnectTimer, clearStableTimer]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    reconnectAttemptRef.current = 0;
    void connect();
    return () => {
      abortRef.current?.abort();
      clearReconnectTimer();
      clearStableTimer();
    };
  }, [connect, clearReconnectTimer, clearStableTimer]);

  return { ...state, reconnect: connect };
}
