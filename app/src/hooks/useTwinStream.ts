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

export function useTwinStream(reportId: string | null, options?: { persistent?: boolean }) {
  const persistent = options?.persistent !== false;
  const [state, setState] = useState<State>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(async () => {
    if (!reportId) return;
    abortRef.current?.abort();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
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
        const { done, value } = await reader.read();
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
        const delay = RECONNECT_BASE_MS;
        reconnectTimerRef.current = setTimeout(() => {
          void connect();
        }, delay);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Twin stream eșuat';
      setState((s) => ({ ...s, loading: false, error: message, connected: false }));

      if (persistent && reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptRef.current += 1;
        const delay = RECONNECT_BASE_MS * reconnectAttemptRef.current;
        reconnectTimerRef.current = setTimeout(() => {
          void connect();
        }, delay);
      }
    }
  }, [reportId, persistent]);

  useEffect(() => {
    reconnectAttemptRef.current = 0;
    void connect();
    return () => {
      abortRef.current?.abort();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  return { ...state, reconnect: connect };
}