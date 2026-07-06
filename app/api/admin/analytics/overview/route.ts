import { and, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../../lib/adminAuth';
import { corsJson, corsOptions } from '../../../lib/http';

export const config = { runtime: 'nodejs' };

function clampInt(v: string | null, def: number, min: number, max: number): number {
  const n = Number.parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function dateToDayUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function addDaysUtc(day: string, add: number): string | null {
  const m = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number.parseInt(m[1]!, 10);
  const mo = Number.parseInt(m[2]!, 10) - 1;
  const da = Number.parseInt(m[3]!, 10);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null;
  const d = new Date(Date.UTC(y, mo, da));
  d.setUTCDate(d.getUTCDate() + add);
  return dateToDayUtc(d);
}

type Overview = {
  windowDays: number;
  funnel: Array<{ step: string; users: number }>;
  retention: Array<{ day: 'D1' | 'D7' | 'D30'; cohort: number; returning: number; rate: number }>;
  activation: { activated: number; eligible: number; rate: number };
  aiQueriesPerSession7d: { avg: number; p50: number; p90: number };
  segments: Array<{ label: string; users: number }>;
  powerUsers: Array<{ userId: string; walletAddress: string; aiQueries7d: number }>;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const windowDays = clampInt(url.searchParams.get('days'), 30, 1, 90);
  const now = new Date();
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since31 = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

  const db = getDb();

  const [landing] = await db
    .select({ c: sql<number>`count(distinct ${schema.analyticsEvents.anonId})`.as('c') })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since), eq(schema.analyticsEvents.name, 'page_view')));
  const [connected] = await db
    .select({ c: sql<number>`count(distinct ${schema.analyticsEvents.anonId})`.as('c') })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since), eq(schema.analyticsEvents.name, 'wallet_connect')));
  const [staked] = await db
    .select({ c: sql<number>`count(distinct ${schema.analyticsEvents.anonId})`.as('c') })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since), eq(schema.analyticsEvents.name, 'stake_start')));

  const [eligible] = await db
    .select({ c: sql<number>`count(distinct ${schema.analyticsEvents.anonId})`.as('c') })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since), eq(schema.analyticsEvents.name, 'page_view')));
  const [activated] = await db
    .select({ c: sql<number>`count(distinct ${schema.analyticsEvents.anonId})`.as('c') })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since), eq(schema.analyticsEvents.name, 'ai_activation')));

  const sessions7d = await db
    .select({
      cnt: sql<number>`count(*)`.as('cnt'),
    })
    .from(schema.analyticsEvents)
    .where(and(gte(schema.analyticsEvents.createdAt, since7), eq(schema.analyticsEvents.name, 'ai_query')))
    .groupBy(schema.analyticsEvents.sessionId);
  const sessionCounts = sessions7d.map((r) => r.cnt ?? 0).filter((n) => Number.isFinite(n));
  sessionCounts.sort((a, b) => a - b);
  const avg = sessionCounts.length ? sessionCounts.reduce((a, b) => a + b, 0) / sessionCounts.length : 0;
  const p50 = sessionCounts.length ? sessionCounts[Math.floor((sessionCounts.length - 1) * 0.5)] ?? 0 : 0;
  const p90 = sessionCounts.length ? sessionCounts[Math.floor((sessionCounts.length - 1) * 0.9)] ?? 0 : 0;

  const daysRows = await db
    .select({ anonId: schema.analyticsEvents.anonId, day: schema.analyticsEvents.day })
    .from(schema.analyticsEvents)
    .where(gte(schema.analyticsEvents.createdAt, since31))
    .groupBy(schema.analyticsEvents.anonId, schema.analyticsEvents.day);

  const byAnon = new Map<string, Set<string>>();
  for (const r of daysRows) {
    const a = r.anonId ?? '';
    const d = r.day ?? '';
    if (!a || !d) continue;
    const set = byAnon.get(a) ?? new Set<string>();
    set.add(d);
    byAnon.set(a, set);
  }

  const today = dateToDayUtc(now);
  const retention = (['D1', 'D7', 'D30'] as const).map((label) => {
    const offset = label === 'D1' ? 1 : label === 'D7' ? 7 : 30;
    const latestCohortDay = addDaysUtc(today, -offset);
    let cohort = 0;
    let returning = 0;
    if (!latestCohortDay) return { day: label, cohort: 0, returning: 0, rate: 0 };
    for (const [, days] of byAnon) {
      const first = [...days].sort()[0];
      if (!first) continue;
      if (first > latestCohortDay) continue;
      cohort += 1;
      const target = addDaysUtc(first, offset);
      if (target && days.has(target)) returning += 1;
    }
    const rate = cohort > 0 ? returning / cohort : 0;
    return { day: label, cohort, returning, rate };
  });

  const devUsers = await db
    .select({ userId: schema.publicApiKeys.userId })
    .from(schema.publicApiKeys)
    .groupBy(schema.publicApiKeys.userId);
  const devSet = new Set(devUsers.map((r) => r.userId).filter((x): x is string => Boolean(x)));

  const txSums = await db
    .select({
      userId: schema.transactions.userId,
      total: sql<string>`coalesce(sum(${schema.transactions.amount}), 0)`.as('total'),
    })
    .from(schema.transactions)
    .groupBy(schema.transactions.userId);

  const totals: Array<{ userId: string; total: number }> = txSums
    .map((r) => ({
      userId: r.userId,
      total: typeof r.total === 'string' ? Number.parseFloat(r.total) : Number(r.total),
    }))
    .filter((r) => r.userId && Number.isFinite(r.total));
  totals.sort((a, b) => a.total - b.total);
  const whaleThreshold = totals.length ? totals[Math.floor((totals.length - 1) * 0.9)]?.total ?? 0 : 0;
  const whales = new Set(totals.filter((r) => r.total >= whaleThreshold && r.total > 0).map((r) => r.userId));

  const [totalUsers] = await db.select({ c: sql<number>`count(*)`.as('c') }).from(schema.users);
  const userCount = totalUsers?.c ?? 0;
  const devCount = devSet.size;
  const whaleCount = [...whales].filter((id) => !devSet.has(id)).length;
  const retailCount = Math.max(0, userCount - devCount - whaleCount);

  const power = await db
    .select({
      userId: schema.aiQueryLogs.userId,
      c: sql<number>`count(*)`.as('c'),
    })
    .from(schema.aiQueryLogs)
    .where(and(gte(schema.aiQueryLogs.createdAt, since7), isNotNull(schema.aiQueryLogs.userId)))
    .groupBy(schema.aiQueryLogs.userId)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(20);

  const powerUserIds = power.map((r) => r.userId).filter((x): x is string => Boolean(x));
  const powerUsersRows = powerUserIds.length
    ? await db
        .select({ id: schema.users.id, walletAddress: schema.users.walletAddress })
        .from(schema.users)
        .where(inArray(schema.users.id, powerUserIds))
    : [];
  const walletById = new Map(powerUsersRows.map((r) => [r.id, r.walletAddress]));

  const overview: Overview = {
    windowDays,
    funnel: [
      { step: 'landing', users: landing?.c ?? 0 },
      { step: 'connect', users: connected?.c ?? 0 },
      { step: 'stake', users: staked?.c ?? 0 },
    ],
    retention,
    activation: {
      activated: activated?.c ?? 0,
      eligible: eligible?.c ?? 0,
      rate: (eligible?.c ?? 0) > 0 ? (activated?.c ?? 0) / (eligible?.c ?? 0) : 0,
    },
    aiQueriesPerSession7d: { avg, p50, p90 },
    segments: [
      { label: 'developers', users: devCount },
      { label: 'whales', users: whaleCount },
      { label: 'retail', users: retailCount },
    ],
    powerUsers: power
      .map((r) => {
        const id = r.userId ?? '';
        const walletAddress = walletById.get(id) ?? '';
        return { userId: id, walletAddress, aiQueries7d: r.c ?? 0 };
      })
      .filter((r) => r.userId && r.walletAddress),
  };

  return corsJson(req, 200, overview);
}
