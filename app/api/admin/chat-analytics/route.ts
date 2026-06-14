import { getDb } from '../../../db/client';
import { chatConversations, chatAnalytics } from '../../../db/schema';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method !== 'GET') return corsJson(req, 405, { error: 'Method not allowed' });

  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const filterResolved = url.searchParams.get('resolved');
  const filterDateFrom = url.searchParams.get('date_from') || '';
  const filterDateTo = url.searchParams.get('date_to') || '';

  const db = getDb();

  const conditions: ReturnType<typeof and>[] = [];

  if (filterResolved === 'true') conditions.push(eq(chatConversations.resolved, true));
  if (filterResolved === 'false') conditions.push(eq(chatConversations.resolved, false));
  if (filterDateFrom) conditions.push(gte(chatConversations.createdAt, new Date(filterDateFrom)));
  if (filterDateTo) conditions.push(lte(chatConversations.createdAt, new Date(filterDateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, items] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(chatConversations).where(whereClause),
    db.select().from(chatConversations).where(whereClause).orderBy(desc(chatConversations.updatedAt)).limit(limit).offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  // Get daily analytics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dailyAnalytics = await db.select()
    .from(chatAnalytics)
    .where(gte(chatAnalytics.date, thirtyDaysAgo.toISOString().slice(0, 10)))
    .orderBy(desc(chatAnalytics.date));

  // Get top topics across all conversations
  const allConversations = await db.select({ messages: chatConversations.messages }).from(chatConversations);
  const topicCounts: Record<string, number> = {};
  const topicKeywords = ['pret', 'cost', 'finantare', 'montaj', 'garantie', 'acoperis', 'fotovoltaic', 'contact', 'program', 'casa verde'];
  for (const conv of allConversations) {
    const msgs = conv.messages as Array<{ role: string; content: string }>;
    for (const msg of msgs) {
      const lower = msg.content.toLowerCase();
      for (const keyword of topicKeywords) {
        if (lower.includes(keyword)) {
          topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
        }
      }
    }
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  // Resolution rate
  const resolvedCount = await db.select({ count: sql<number>`count(*)` }).from(chatConversations).where(eq(chatConversations.resolved, true));
  const totalCount = await db.select({ count: sql<number>`count(*)` }).from(chatConversations);
  const resolutionRate = totalCount[0]?.count > 0 ? Math.round((resolvedCount[0]?.count / totalCount[0]?.count) * 100) : 0;

  return corsJson(req, 200, {
    conversations: items.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      firstMessage: item.firstMessage,
      messageCount: item.messageCount,
      resolved: item.resolved,
      createdAt: item.createdAt?.toISOString() ?? '',
      updatedAt: item.updatedAt?.toISOString() ?? '',
    })),
    total,
    totalPages,
    page,
    limit,
    dailyAnalytics: dailyAnalytics.map((a) => ({
      date: a.date,
      totalConversations: a.totalConversations,
      totalMessages: a.totalMessages,
      avgMessagesPerConv: a.avgMessagesPerConv,
    })),
    topTopics,
    resolutionRate,
  });
}
