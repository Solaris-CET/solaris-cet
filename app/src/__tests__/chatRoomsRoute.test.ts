// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAT_ROOMS_PATH, CHAT_ROOMS_PROBE } from '../../api/lib/chatRooms';

const roomsMocks = vi.hoisted(() => ({
  existingGlobal: true,
  rooms: [
    { id: 'room-1', slug: 'global', title: 'Global', kind: 'global', eventId: null },
    { id: 'room-2', slug: 'event-1', title: 'Event Chat', kind: 'event', eventId: 'evt-1' },
  ],
  inserted: false,
}));

vi.mock('../../api/lib/cors', () => ({
  getAllowedOrigin: () => 'https://allowed.test',
}));

vi.mock('../../db/client', () => ({
  getDb: () => ({
    select() {
      return {
        from() {
          return {
            where: async () => (roomsMocks.existingGlobal ? [roomsMocks.rooms[0]] : []),
            orderBy() {
              return {
                limit: async () => roomsMocks.rooms,
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values: async () => {
          roomsMocks.inserted = true;
        },
      };
    },
  }),
  schema: {
    chatRooms: { slug: 'chatRooms.slug', createdAt: 'chatRooms.createdAt' },
  },
}));

import chatRoomsRoute, { CHAT_ROOMS_PROBE as routeProbe } from '../../api/chat/rooms/route';

function roomsRequest(init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', 'https://allowed.test');
  return new Request(`http://test${CHAT_ROOMS_PATH}`, { ...init, headers });
}

describe('chatRooms helpers', () => {
  it('exports stable e2e probe contract', () => {
    expect(CHAT_ROOMS_PROBE.path).toBe('/api/chat/rooms');
    expect(routeProbe.globalRoomSlug).toBe('global');
    expect(routeProbe.listLimit).toBe(50);
  });
});

describe('/api/chat/rooms e2e probe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomsMocks.existingGlobal = true;
    roomsMocks.inserted = false;
  });

  it('is registered in server/index.cjs', () => {
    const src = readFileSync(join(process.cwd(), 'server', 'index.cjs'), 'utf8');
    expect(src).toContain(CHAT_ROOMS_PATH);
    expect(src).toContain('api/chat/rooms/route.js');
  });

  it('OPTIONS returns CORS preflight', async () => {
    const res = await chatRoomsRoute(roomsRequest({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
  });

  it('GET returns rooms list', async () => {
    const res = await chatRoomsRoute(roomsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rooms: Array<{ slug: string }> };
    expect(body.rooms).toHaveLength(2);
    expect(body.rooms[0]?.slug).toBe('global');
  });

  it('GET seeds global room when missing', async () => {
    roomsMocks.existingGlobal = false;
    const res = await chatRoomsRoute(roomsRequest({ method: 'GET' }));
    expect(res.status).toBe(200);
    expect(roomsMocks.inserted).toBe(true);
  });

  it('POST returns 405', async () => {
    const res = await chatRoomsRoute(roomsRequest({ method: 'POST' }));
    expect(res.status).toBe(405);
  });
});