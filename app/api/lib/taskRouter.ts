export const TASK_ROUTER_PATH = '/api/route';
export const TASK_ROUTER_METHODS = 'POST, OPTIONS';

export const TASK_ROUTER_PROBE = {
  path: TASK_ROUTER_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  invalidJsonError: 'Invalid JSON body' as const,
  highLatencyMs: 250,
  mediumLatencyMs: 900,
  lowLatencyMs: 2500,
  minExecutionDelayMs: 40,
  timeoutStatus: 504,
};

export type TaskPriority = 'high' | 'medium' | 'low';

export type ClassifiedTask = {
  name: TaskPriority;
  priority: number;
  latencyMs: number;
};

export function parseTaskRouterQuery(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const query = (body as { query?: unknown }).query;
  return typeof query === 'string' ? query : '';
}

export function classifyTaskRouterQuery(query: string): ClassifiedTask {
  const q = query.toLowerCase();
  if (/(urgent|asap|now|immediately|emergency|help)/.test(q)) {
    return { name: 'high', priority: 1, latencyMs: TASK_ROUTER_PROBE.highLatencyMs };
  }
  if (/(soon|today|fast|quick|estimate|price|swap)/.test(q)) {
    return { name: 'medium', priority: 2, latencyMs: TASK_ROUTER_PROBE.mediumLatencyMs };
  }
  return { name: 'low', priority: 3, latencyMs: TASK_ROUTER_PROBE.lowLatencyMs };
}

export async function executeTaskRouterAgent(name: TaskPriority, query: string, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await new Promise((r) => setTimeout(r, Math.min(TASK_ROUTER_PROBE.minExecutionDelayMs, timeoutMs)));
    const prefix = name === 'high' ? 'Fast path' : name === 'medium' ? 'Standard path' : 'Background path';
    return { ok: true as const, result: `${prefix}: routed query "${query.trim().slice(0, 120)}"` };
  } catch {
    return { ok: false as const, result: 'Timed out' };
  } finally {
    clearTimeout(id);
    void controller;
  }
}