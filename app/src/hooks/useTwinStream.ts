import { useCallback, useEffect, useRef, useState } from 'react';

import { twinStreamUrl } from '@/lib/twinRuntimeApi';
import type { TwinEvent, TwinStreamMessage } from '@/lib/twinRuntime';
import type { TwinFeed } from '@/lib/twinFeed';

type State = {
  feed: TwinFeed | null;
  events: TwinEvent[];
  ready: boolean;
  error: string;
  loading: boolean;
};

const INITIAL: State = {
  feed: null,
  events: [],
  ready: false,
  error: '',
  loading: false,
};

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
    if (eventType === 'error') return { type: 'error', message: String(data.error ?? 'Twin stream error') };
    return { type: 'event', event: data as unknown as TwinEvent };
  } catch {
    return null;
  }
}

export function useTwinStream(reportId: string | null) {
  const [state, setState] = useState<State>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const connect = useCallback(async () => {
    if (!reportId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true, error: '', ready: false }));

    try {
      const res = await fetch(twinStreamUrl(reportId), { signal: controller.signal });
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
          setState((s) => {
            if (msg.type === 'snapshot') {
              return { ...s, feed: msg.feed, loading: false };
            }
            if (msg.type === 'event') {
              const events = [msg.event, ...s.events].slice(0, 20);
              return { ...s, events, loading: false };
            }
            if (msg.type === 'ready') {
              return { ...s, ready: true, loading: false };
            }
            if (msg.type === 'error') {
              return { ...s, error: msg.message, loading: false };
            }
            return s;
          });
        }
      }
      setState((s) => ({ ...s, loading: false, ready: true }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Twin stream eșuat',
      }));
    }
  }, [reportId]);

  useEffect(() => {
    void connect();
    return () => abortRef.current?.abort();
  }, [connect]);

  return { ...state, reconnect: connect };
}