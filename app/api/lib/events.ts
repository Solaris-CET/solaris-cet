export const EVENTS_PATH = '/api/events';
export const EVENTS_METHODS = 'GET, OPTIONS';

export const EVENTS_PROBE = {
  path: EVENTS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  upcomingLookbackMs: 24 * 60 * 60 * 1000,
  listLimit: 100,
};

export function eventsUpcomingCutoff(now = Date.now()): Date {
  return new Date(now - EVENTS_PROBE.upcomingLookbackMs);
}