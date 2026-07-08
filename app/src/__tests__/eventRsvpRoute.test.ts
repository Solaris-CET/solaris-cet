// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EVENT_RSVP_PATH,
  EVENT_RSVP_PROBE,
  eventRsvpDedupeKey,
  isEventRsvpCancel,
  parseEventRsvpPostBody,
} from '../../api/lib/eventRsvp';

const rsvpMocks = vi.hoisted(() => ({
  authOk: true,
  deleted: false,
  upserted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../api/lib/auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('Authorization') ?? '';
    if (!rsvpMocks.authOk || !auth.startsWith('Bearer valid-token')) {
      return { error: 'Unauthorized', status: 401 };
    }
    return { user: { id: 'user-1', walletAddress: 'EQabc', role: 'user' }, sid: 'sess-1', mfaEnabled: false };
  },
}));

vi.mock('../../api/lib/points', () => ({
  awardPoints: async () => undefined,
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    delete() {
      return {
        where: async () => {
          rsvpMocks.deleted = true;
        },
      };
    },
    insert() {
      return {
        values() {
          rsvpMocks.upserted = true;
          return {
            onConflictDoUpdate: async () => undefined,
          };
        },
      };
    },
  }),
  schema: {
    eventRsvps: { eventId: 'eventRsvps.eventId', userId: 'eventRsvps.userId' },
  },
}));

import eventRsvpRoute, { EVENT_RSVP_PROBE as routeProbe } from '../../api/events/rsvp/route';

function rsvpRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${EVENT_RSVP_PATH}`, { ...init, headers });
}

describe('eventRsvp helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(EVENT_RSVP_PROBE.path).toBe('/api/events/rsvp');
    expect(routeProbe.rsvpPoints).toBe(3);
    expect(routeProbe.authRequired).toBe(true);
  });

  it('parseEventRsvpPostBody and isEventRsvpCancel', () => {
    expect(parseEventRsvpPostBody({ eventId: ' evt-1 ', status: 'none' })).toEqual({ eventId: 'evt-1', status: 'none' });
    expect(isEventRsvpCancel('none')).toBe(true);
    expect(eventRsvpDedupeKey('evt-1')).toBe('rsvp:evt-1');
  });
});

describe('/api/events/rsvp e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rsvpMocks.authOk = true;
    rsvpMocks.deleted = false;
    rsvpMocks.upserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(EVENT_RSVP_PATH);
    expect(src).toContain('api/events/rsvp/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await eventRsvpRoute(rsvpRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('POST without auth returns 401', async () => {
    rsvpMocks.authOk = false;
    const res = await eventRsvpRoute(rsvpRequest({ method: 'POST', body: JSON.stringify({ eventId: 'evt-1' }) }));
    expect(res.status).toBe(401);
  });

  it('POST creates RSVP', async () => {
    const res = await eventRsvpRoute(
      rsvpRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ eventId: 'evt-1' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; status: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('yes');
    expect(rsvpMocks.upserted).toBe(true);
  });

  it('POST with status none cancels RSVP', async () => {
    const res = await eventRsvpRoute(
      rsvpRequest({
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
        body: JSON.stringify({ eventId: 'evt-1', status: 'none' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(rsvpMocks.deleted).toBe(true);
  });
});