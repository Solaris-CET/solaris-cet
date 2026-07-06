import type { SQL } from 'drizzle-orm';
import { and, asc, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { getDb, schema } from '../../../db/client';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

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
  const sessionId = String(url.searchParams.get('session_id') ?? '').trim();
  const filterResolved = url.searchParams.get('resolved');
  const filterDateFrom = url.searchParams.get('date_from') || '';
  const filterDateTo = url.searchParams.get('date_to') || '';

  const db = getDb();

  if (sessionId) {
    const [conversation] = await db
      .select()
      .from(schema.crmConversations)
      .where(eq(schema.crmConversations.id, sessionId))
      .limit(1);
    if (!conversation) return corsJson(req, 404, { error: 'Conversation not found' });

    const messages = await db
      .select()
      .from(schema.crmMessages)
      .where(eq(schema.crmMessages.conversationId, conversation.id))
      .orderBy(asc(schema.crmMessages.createdAt));

    return corsJson(req, 200, {
      messages: messages.map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.body,
        timestamp: message.createdAt.toISOString(),
      })),
    });
  }

  const conditions: SQL<unknown>[] = [];

  if (filterResolved === 'true') conditions.push(eq(schema.crmConversations.status, 'resolved'));
  if (filterResolved === 'false') conditions.push(eq(schema.crmConversations.status, 'open'));
  if (filterDateFrom) conditions.push(gte(schema.crmConversations.createdAt, new Date(filterDateFrom)));
  if (filterDateTo) conditions.push(lte(schema.crmConversations.createdAt, new Date(filterDateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, items, resolvedCount, totalCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.crmConversations).where(whereClause),
    db
      .select()
      .from(schema.crmConversations)
      .where(whereClause)
      .orderBy(desc(schema.crmConversations.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.crmConversations).where(eq(schema.crmConversations.status, 'resolved')),
    db.select({ count: sql<number>`count(*)` }).from(schema.crmConversations),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  const itemIds = items.map((item) => item.id);
  const itemMessages = itemIds.length
    ? await db
        .select()
        .from(schema.crmMessages)
        .where(inArray(schema.crmMessages.conversationId, itemIds))
        .orderBy(asc(schema.crmMessages.createdAt))
    : [];
  const messagesByConversation = new Map<string, Array<typeof itemMessages[number]>>();
  for (const message of itemMessages) {
    const bucket = messagesByConversation.get(message.conversationId) ?? [];
    bucket.push(message);
    messagesByConversation.set(message.conversationId, bucket);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [recentConversations, recentMessages] = await Promise.all([
    db
      .select({ id: schema.crmConversations.id, createdAt: schema.crmConversations.createdAt })
      .from(schema.crmConversations)
      .where(gte(schema.crmConversations.createdAt, thirtyDaysAgo)),
    db
      .select({
        conversationId: schema.crmMessages.conversationId,
        body: schema.crmMessages.body,
        createdAt: schema.crmMessages.createdAt,
      })
      .from(schema.crmMessages)
      .where(gte(schema.crmMessages.createdAt, thirtyDaysAgo)),
  ]);

  const dailyBuckets = new Map<string, { totalConversations: number; totalMessages: number }>();
  for (const conversation of recentConversations) {
    const day = conversation.createdAt.toISOString().slice(0, 10);
    const bucket = dailyBuckets.get(day) ?? { totalConversations: 0, totalMessages: 0 };
    bucket.totalConversations += 1;
    dailyBuckets.set(day, bucket);
  }
  for (const message of recentMessages) {
    const day = message.createdAt.toISOString().slice(0, 10);
    const bucket = dailyBuckets.get(day) ?? { totalConversations: 0, totalMessages: 0 };
    bucket.totalMessages += 1;
    dailyBuckets.set(day, bucket);
  }
  const dailyAnalytics = [...dailyBuckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, stats]) => ({
      date,
      totalConversations: stats.totalConversations,
      totalMessages: stats.totalMessages,
      avgMessagesPerConv:
        stats.totalConversations > 0 ? Number((stats.totalMessages / stats.totalConversations).toFixed(2)) : 0,
    }));

  const topicCounts: Record<string, number> = {};
  const topicKeywords = ['pret', 'cost', 'finantare', 'montaj', 'garantie', 'acoperis', 'fotovoltaic', 'contact', 'program', 'casa verde'];
  for (const message of recentMessages) {
    const lower = message.body.toLowerCase();
    for (const keyword of topicKeywords) {
      if (lower.includes(keyword)) {
        topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
      }
    }
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  const totalConversationCount = Number(totalCount[0]?.count ?? 0);
  const resolvedConversationCount = Number(resolvedCount[0]?.count ?? 0);
  const resolutionRate = totalConversationCount > 0 ? Math.round((resolvedConversationCount / totalConversationCount) * 100) : 0;

  return corsJson(req, 200, {
    conversations: items.map((item) => ({
      id: item.id,
      sessionId: item.id,
      firstMessage: (messagesByConversation.get(item.id)?.[0]?.body ?? item.pageUrl ?? 'Fara mesaj').slice(0, 240),
      messageCount: messagesByConversation.get(item.id)?.length ?? 0,
      resolved: item.status === 'resolved',
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
