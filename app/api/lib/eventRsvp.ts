export const EVENT_RSVP_PATH = '/api/events/rsvp';
export const EVENT_RSVP_METHODS = 'POST, OPTIONS';

export const EVENT_RSVP_PROBE = {
  path: EVENT_RSVP_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  defaultStatus: 'yes' as const,
  cancelStatus: 'none' as const,
  rsvpPoints: 3,
  invalidEventError: 'Invalid event' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export type EventRsvpPostBody = { eventId: string; status: string };

export function parseEventRsvpPostBody(body: unknown): EventRsvpPostBody {
  const eventId =
    typeof body === 'object' && body !== null && 'eventId' in body && typeof (body as { eventId?: unknown }).eventId === 'string'
      ? (body as { eventId: string }).eventId.trim()
      : '';
  const status =
    typeof body === 'object' && body !== null && 'status' in body && typeof (body as { status?: unknown }).status === 'string'
      ? (body as { status: string }).status.trim()
      : EVENT_RSVP_PROBE.defaultStatus;
  return { eventId, status };
}

export function isEventRsvpCancel(status: string): boolean {
  return status === EVENT_RSVP_PROBE.cancelStatus;
}

export function eventRsvpDedupeKey(eventId: string): string {
  return `rsvp:${eventId}`;
}