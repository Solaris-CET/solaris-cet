import { getAllowedOrigin } from '@/api/lib/cors';
import {
  classifyTaskRouterQuery,
  executeTaskRouterAgent,
  parseTaskRouterQuery,
  TASK_ROUTER_PROBE,
} from '../lib/taskRouter';

export { TASK_ROUTER_PATH, TASK_ROUTER_PROBE } from '@/api/lib/taskRouter';

export const config = { runtime: 'edge' };

function jsonResponse(body: unknown, allowedOrigin: string, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      Vary: 'Origin',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': TASK_ROUTER_PROBE.methods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, allowedOrigin, 405);
  }

  try {
    const body = await req.json();
    const query = parseTaskRouterQuery(body);
    const task = classifyTaskRouterQuery(query);
    const result = await executeTaskRouterAgent(task.name, query, task.latencyMs);
    return jsonResponse({ task, ...result }, allowedOrigin, result.ok ? 200 : TASK_ROUTER_PROBE.timeoutStatus);
  } catch {
    return jsonResponse({ error: TASK_ROUTER_PROBE.invalidJsonError }, allowedOrigin, 400);
  }
}