export const REALTIME_PRESENCE_PATH = '/api/realtime/presence';
export const REALTIME_PRESENCE_METHODS = 'GET, OPTIONS';

export const REALTIME_PRESENCE_PROBE = {
  path: REALTIME_PRESENCE_PATH,
  methods: ['GET', 'OPTIONS'] as const,
  authRequired: false,
  contentType: 'text/event-stream; charset=utf-8' as const,
  cacheControl: 'no-cache, no-transform' as const,
  pingIntervalMs: 15_000,
};

type PresenceClient = { id: string; send: (payload: string) => void; close: () => void };

const clients = new Map<string, PresenceClient>();
let connected = 0;

export function getRealtimePresenceCount(): number {
  return connected;
}

export function formatPresenceCountEvent(count: number): string {
  return `data: ${JSON.stringify({ count })}\n\n`;
}

export function formatPresencePingEvent(timestamp = Date.now()): string {
  return `event: ping\ndata: ${timestamp}\n\n`;
}

function broadcastPresenceCount() {
  const payload = formatPresenceCountEvent(connected);
  const dead: string[] = [];

  for (const c of clients.values()) {
    try {
      c.send(payload);
    } catch {
      dead.push(c.id);
    }
  }

  for (const id of dead) {
    removePresenceClient(id);
  }
}

function removePresenceClient(id: string): void {
  const had = clients.delete(id);
  if (had) {
    connected = Math.max(0, connected - 1);
    broadcastPresenceCount();
  }
}

export function __resetRealtimePresenceForTests(): void {
  clients.clear();
  connected = 0;
}

export function createRealtimePresenceStream(req: Request): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const id = crypto.randomUUID();
  let closed = false;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
          removePresenceClient(id);
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          void 0;
        }
      };

      clients.set(id, { id, send, close });
      connected += 1;
      send(formatPresenceCountEvent(connected));
      broadcastPresenceCount();

      const pingId = setInterval(() => {
        if (closed) return;
        send(formatPresencePingEvent());
      }, REALTIME_PRESENCE_PROBE.pingIntervalMs);

      const cleanup = () => {
        clearInterval(pingId);
        removePresenceClient(id);
        close();
      };

      req.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      removePresenceClient(id);
    },
  });
}
