import { getDb } from '../../../db/client';
import { leads } from '../../../db/schema';
import { requireAdminAuth, requireAdminRole } from '../../lib/adminAuth';
import { getAllowedOrigin } from '../../lib/cors';
import { corsJson, corsOptions } from '../../lib/http';
import { and, eq, gte, lte, sql, desc, asc } from 'drizzle-orm';

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  if (origin && allowedOrigin !== origin) return corsJson(req, 403, { error: 'Forbidden' });
  if (req.method === 'OPTIONS') return corsOptions(req, 'GET, PUT, OPTIONS');
  if (req.method === 'GET') return handleGet(req, allowedOrigin);
  if (req.method === 'PUT') return handlePut(req, allowedOrigin);
  return corsJson(req, 405, { error: 'Method not allowed' });
}

async function handleGet(req: Request, allowedOrigin: string): Promise<Response> {
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

  const conditions: ReturnType<typeof and>[] = [];

  if (filterService) {
    conditions.push(eq(leads.serviceType, filterService));
  }
  if (filterStatus) {
    conditions.push(eq(leads.status, filterStatus));
  }
  if (filterDateFrom) {
    conditions.push(gte(leads.createdAt, new Date(filterDateFrom)));
  }
  if (filterDateTo) {
    conditions.push(lte(leads.createdAt, new Date(filterDateTo)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = sortDir === 'asc' ? asc(leads[sortField as keyof typeof leads] ?? leads.createdAt) : desc(leads[sortField as keyof typeof leads] ?? leads.createdAt);

  const [totalResult, items] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(leads).where(whereClause),
    db.select().from(leads).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / limit);

  return corsJson(req, 200, {
    leads: items.map((item) => ({
      id: item.id,
      source: 'lead' as const,
      createdAt: item.createdAt?.toISOString() ?? '',
      name: item.name,
      phone: item.phone,
      email: item.email,
      location: item.location,
      serviceType: item.serviceType,
      status: item.status,
      notes: item.notes,
    })),
    total,
    totalPages,
    page,
    limit,
  });
}

async function handlePut(req: Request, allowedOrigin: string): Promise<Response> {
  const ctx = await requireAdminAuth(req);
  if ('error' in ctx) return corsJson(req, ctx.status, { error: ctx.error });
  const ok = requireAdminRole(ctx, 'editor');
  if (!ok.ok) return corsJson(req, ok.status, { error: ok.error });

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id) return corsJson(req, 400, { error: 'Missing id' });

  let body: { status?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return corsJson(req, 400, { error: 'Invalid JSON' });
  }

  const validStatuses = ['nou', 'contactat', 'rezolvat'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return corsJson(req, 400, { error: 'Invalid status' });
  }

  const db = getDb();
  await db.update(leads).set({ status: body.status, notes: body.notes ?? null }).where(eq(leads.id, id));

  return corsJson(req, 200, { success: true });
}
