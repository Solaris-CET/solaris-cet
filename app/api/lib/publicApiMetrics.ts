import { getDb, schema } from '../../db/client';

export type PublicApiUsagePoint = {
  tsMs: number;
  apiKeyId: string | null;
  userId: string | null;
  method: string;
  path: string;
  status: number;
  latencyMs: number | null;
};

const maxPoints = 25_000;
const points: PublicApiUsagePoint[] = [];

function pushPoint(p: PublicApiUsagePoint) {
  points.push(p);
  if (points.length > maxPoints) points.splice(0, points.length - maxPoints);
}

export async function recordPublicApiUsage(p: Omit<PublicApiUsagePoint, 'tsMs'> & { tsMs?: number }): Promise<void> {
  const tsMs = typeof p.tsMs === 'number' ? p.tsMs : Date.now();
  pushPoint({ ...p, tsMs });

  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    const db = getDb();
    await db.insert(schema.publicApiUsage).values({
      apiKeyId: p.apiKeyId,
      userId: p.userId,
      method: p.method.slice(0, 16),
      path: p.path.slice(0, 300),
      status: p.status,
      latencyMs: p.latencyMs,
    });
  } catch {
    void 0;
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx] ?? 0;
}

export function aggregatePublicApiUsage(opts: { sinceMs: number; apiKeyId?: string | null; pathPrefix?: string }): {
  total: number;
  byStatus: Record<string, number>;
  lat: { p50: number; p95: number; p99: number; avg: number; count: number };
} {
  const byStatus: Record<string, number> = {};
  const latencies: number[] = [];
  let latSum = 0;
  let latCount = 0;
  let total = 0;

  for (let i = points.length - 1; i >= 0; i -= 1) {
    const pt = points[i];
    if (!pt) continue;
    if (pt.tsMs < opts.sinceMs) break;
    if (opts.apiKeyId !== undefined && pt.apiKeyId !== opts.apiKeyId) continue;
    if (opts.pathPrefix && !pt.path.startsWith(opts.pathPrefix)) continue;

    total += 1;
    const k = String(pt.status);
    byStatus[k] = (byStatus[k] ?? 0) + 1;
    if (typeof pt.latencyMs === 'number' && Number.isFinite(pt.latencyMs)) {
      latencies.push(pt.latencyMs);
      latSum += pt.latencyMs;
      latCount += 1;
    }
  }

  latencies.sort((a, b) => a - b);
  return {
    total,
    byStatus,
    lat: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      avg: latCount ? Math.round(latSum / latCount) : 0,
      count: latCount,
    },
  };
}

