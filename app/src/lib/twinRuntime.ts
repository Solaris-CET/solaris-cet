import type { TwinFeed } from './twinFeed';

export const TWIN_EVENT_SCHEMA = 'solaris-twin-event-v1';

export type TwinEventType =
  | 'report_generated'
  | 'correction_logged'
  | 'feed_refreshed'
  | 'twin_ready'
  | 'crm_sync'
  | 'snapshot'
  | 'ready'
  | 'heartbeat'
  | 'error';

export type TwinEvent = {
  schema: string;
  runtime_version: number;
  event_id: string;
  report_id: string;
  event_type: TwinEventType;
  payload: Record<string, unknown>;
  timestamp: string;
};

export type TwinRuntimeStatus = {
  schema: string;
  runtime_version: number;
  event_schema: string;
  events_total: number;
  events_path: string;
  sse_supported: boolean;
  persistent_sse?: boolean;
};

export type TwinStreamMessage =
  | { type: 'snapshot'; feed: TwinFeed }
  | { type: 'event'; event: TwinEvent }
  | { type: 'ready'; reportId: string }
  | { type: 'heartbeat'; reportId: string }
  | { type: 'error'; message: string };