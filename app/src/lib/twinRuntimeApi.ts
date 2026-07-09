import type { TwinEvent, TwinRuntimeStatus } from './twinRuntime';

export async function fetchTwinEvents(reportId?: string, limit = 50): Promise<TwinEvent[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (reportId) qs.set('report_id', reportId);
  const res = await fetch(`/api/survey/twin-events?${qs}`);
  const data = (await res.json()) as { events?: TwinEvent[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Twin events indisponibile');
  return data.events ?? [];
}

export async function fetchTwinRuntimeStatus(): Promise<TwinRuntimeStatus> {
  const res = await fetch('/api/survey/twin-events?limit=1');
  if (!res.ok) throw new Error('Twin runtime indisponibil');
  const data = (await res.json()) as { platform?: string };
  return {
    schema: 'solaris-twin-runtime-v1',
    runtime_version: 1,
    event_schema: 'solaris-twin-event-v1',
    events_total: Array.isArray((data as { events?: unknown[] }).events)
      ? ((data as { total?: number }).total ?? 0)
      : 0,
    events_path: '',
    sse_supported: true,
  };
}

export function twinStreamUrl(reportId: string, persistent = true): string {
  const qs = new URLSearchParams({ report_id: reportId });
  if (persistent) qs.set('persistent', '1');
  return `/api/survey/twin-stream?${qs}`;
}

export async function fetchTwinReplay(
  reportId: string,
  fromSeq: number,
  limit = 50,
): Promise<TwinEvent[]> {
  const qs = new URLSearchParams({
    report_id: reportId,
    from_seq: String(Math.max(0, fromSeq)),
    limit: String(limit),
  });
  const res = await fetch(`/api/survey/twin-replay?${qs}`);
  const data = (await res.json()) as { events?: TwinEvent[]; error?: string };
  if (!res.ok) throw new Error(data.error || 'Twin replay indisponibil');
  return data.events ?? [];
}