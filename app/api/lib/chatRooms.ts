export const CHAT_ROOMS_PATH = '/api/chat/rooms';
export const CHAT_ROOMS_METHODS = 'GET, OPTIONS';

export const CHAT_ROOMS_PROBE = {
  path: CHAT_ROOMS_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  listLimit: 50,
  globalRoomSlug: 'global' as const,
  globalRoomTitle: 'Global' as const,
  globalRoomKind: 'global' as const,
};

export const CHAT_ROOM_SELECT_FIELDS = ['id', 'slug', 'title', 'kind', 'eventId'] as const;