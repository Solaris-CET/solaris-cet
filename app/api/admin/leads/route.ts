import type { SQL } from 'drizzle-orm';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { getDb } from '../../../db/client';
import { quotes } from '../../../db/schema';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, OPTIONS');
  if (req.method === 'GET') return handleGet(req);
  return corsJson(req, 405, { error: 'Method not allowed' });
}

async function handleGet(req: Request): Promise<Response> {
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'viewer');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const sortField = url.searchParams.get('sortField') || 'createdAt';
  const sortDir = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const filterService = url.searchParams.get('service_type') || '';
  const filterStatus = url.searchParams.get('status') || '';
  const filterDateFrom = url.searchParams.get('date_from') || '';
  const filterDateTo = url.searchParams.get('date_to') || '';

  const db = getDb();

  const conditions: SQL<unknown>[] = [];

  if (filterService) {
    conditions.push(eq(quotes.serviceType, filterService));
  }
  if (filterStatus && filterStatus !== 'nou') {
    return corsJson(req, 200, { leads: [], total: 0, totalPages: 0, page, limit });
  }
  if (filterDateFrom) {
    conditions.push(gte(quotes.createdAt, new Date(filterDateFrom)));
  }
  if (filterDateTo) {
    conditions.push(lte(quotes.createdAt, new Date(filterDateTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn =
    sortField === 'name'
      ? quotes.name
      : sortField === 'serviceType'
        ? quotes.serviceType
        : sortField === 'location'
          ? quotes.location
          : quotes.createdAt;
  const orderBy = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const [totalResult, items] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(quotes).where(whereClause),
    db.select().from(quotes).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  return corsJson(req, 200, {
    leads: items.map((item) => ({
      id: item.id,
      source: 'quote' as const,
      createdAt: item.createdAt?.toISOString() ?? '',
      name: item.name,
      phone: item.phone,
      email: item.email,
      location: item.location,
      serviceType: item.serviceType,
      status: 'nou' as const,
      notes: item.message ?? null,
    })),
    total,
    totalPages,
    page,
    limit,
  });
}
