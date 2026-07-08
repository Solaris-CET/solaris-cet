export const ANALYTICS_TRACK_PATH = '/api/analytics/track';
export const ANALYTICS_TRACK_METHODS = 'POST, OPTIONS';

export const ANALYTICS_TRACK_PROBE = {
  path: ANALYTICS_TRACK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'analytics_track' as const,
  rateLimit: 240,
  rateWindowSeconds: 60,
  maxEventsPerRequest: 50,
  maxNameLength: 80,
  maxAnonIdLength: 120,
  maxSessionIdLength: 140,
  maxPagePathLength: 500,
  maxReferrerLength: 800,
  missingEventsError: 'Missing events' as const,
  tooManyEventsError: 'Too many events' as const,
  noValidEventsError: 'No valid events' as const,
};

export type IncomingAnalyticsEvent = {
  name: string;
  anonId: string;
  sessionId: string;
  ts?: number;
  props?: unknown;
  pagePath?: unknown;
  referrer?: unknown;
};

export function analyticsDayKeyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function parseIncomingAnalyticsEvent(raw: unknown): IncomingAnalyticsEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const name = typeof rec.name === 'string' ? rec.name.trim() : '';
  const anonId = typeof rec.anonId === 'string' ? rec.anonId.trim() : '';
  const sessionId = typeof rec.sessionId === 'string' ? rec.sessionId.trim() : '';
  const ts = typeof rec.ts === 'number' && Number.isFinite(rec.ts) ? rec.ts : undefined;
  if (!name || name.length > ANALYTICS_TRACK_PROBE.maxNameLength) return null;
  if (!anonId || anonId.length > ANALYTICS_TRACK_PROBE.maxAnonIdLength) return null;
  if (!sessionId || sessionId.length > ANALYTICS_TRACK_PROBE.maxSessionIdLength) return null;
  return { name, anonId, sessionId, ts, props: rec.props, pagePath: rec.pagePath, referrer: rec.referrer };
}

export type AnalyticsEventsParse =
  | { ok: true; events: IncomingAnalyticsEvent[] }
  | { ok: false; error: string };

export function parseAnalyticsEventsBody(body: unknown): AnalyticsEventsParse {
  const rawEvents = (body as { events?: unknown }).events;
  const list = Array.isArray(rawEvents) ? rawEvents : [body];
  if (list.length === 0) return { ok: false, error: ANALYTICS_TRACK_PROBE.missingEventsError };
  if (list.length > ANALYTICS_TRACK_PROBE.maxEventsPerRequest) {
    return { ok: false, error: ANALYTICS_TRACK_PROBE.tooManyEventsError };
  }
  const parsed: IncomingAnalyticsEvent[] = [];
  for (const item of list) {
    const e = parseIncomingAnalyticsEvent(item);
    if (e) parsed.push(e);
  }
  if (parsed.length === 0) return { ok: false, error: ANALYTICS_TRACK_PROBE.noValidEventsError };
  return { ok: true, events: parsed };
}