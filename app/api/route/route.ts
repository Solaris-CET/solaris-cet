import { getAllowedOrigin } from '../lib/cors';

export const config = { runtime: 'edge' };

type Priority = 'high' | 'medium' | 'low';

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
    },
  });
}

function classifyTask(query: string): { name: Priority; priority: number; latencyMs: number } {
  const q = query.toLowerCase();
  if (/(urgent|asap|now|immediately|emergency|help)/.test(q)) {
    return { name: 'high', priority: 1, latencyMs: 250 };
  }
  if (/(soon|today|fast|quick|estimate|price|swap)/.test(q)) {
    return { name: 'medium', priority: 2, latencyMs: 900 };
  }
  return { name: 'low', priority: 3, latencyMs: 2500 };
}

async function executeAgent(name: Priority, query: string, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await new Promise((r) => setTimeout(r, Math.min(40, timeoutMs)));
    const prefix =
      name === 'high' ? 'Fast path' : name === 'medium' ? 'Standard path' : 'Background path';
    return { ok: true, result: `${prefix}: routed query "${query.trim().slice(0, 120)}"` };
  } catch {
    return { ok: false, result: 'Timed out' };
  } finally {
    clearTimeout(id);
    void controller;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = (await req.json()) as { query?: unknown };
    const query = typeof body.query === 'string' ? body.query : '';
    const task = classifyTask(query);

    const result = await executeAgent(task.name, query, task.latencyMs);
    return jsonResponse({ task, ...result }, allowedOrigin, result.ok ? 200 : 504);
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, allowedOrigin, 400);
  }
}

