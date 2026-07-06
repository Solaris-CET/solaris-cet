import { getAllowedOrigin } from '../../lib/cors';
import { corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

type Client = { id: string; send: (payload: string) => void; close: () => void };

const clients = new Map<string, Client>();
let connected = 0;

function broadcast(json: unknown) {
  const payload = `data: ${JSON.stringify(json)}\n\n`;
  for (const c of clients.values()) {
    try {
      c.send(payload);
    } catch {
      void 0;
    }
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': allowedOrigin, Vary: 'Origin' },
    });
  }

  const encoder = new TextEncoder();
  const id = crypto.randomUUID();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));
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
      send(`data: ${JSON.stringify({ count: connected })}\n\n`);
      broadcast({ count: connected });

      const pingId = setInterval(() => {
        if (closed) return;
        try {
          send(`event: ping\ndata: ${Date.now()}\n\n`);
        } catch {
          void 0;
        }
      }, 15_000);

      const cleanup = () => {
        clearInterval(pingId);
        const had = clients.delete(id);
        if (had) {
          connected = Math.max(0, connected - 1);
          broadcast({ count: connected });
        }
        close();
      };

      req.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      const had = clients.delete(id);
      if (had) {
        connected = Math.max(0, connected - 1);
        broadcast({ count: connected });
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}

