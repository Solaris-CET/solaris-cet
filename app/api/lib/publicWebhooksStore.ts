import { randomUUID } from 'node:crypto';

import { desc,eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../db/client';
import { encryptForDb } from './auth';
import { decryptWebhookSecret, hashWebhookSecret } from './publicWebhookCrypto';
import { type DeliveryRecord,dispatchWithRetry } from './publicWebhookDispatcher';

export type WebhookEndpointPublic = {
  id: string;
  userId: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryPublic = {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  httpStatus: number | null;
  error: string | null;
  durationMs: number | null;
  nextRetryAt: string | null;
  createdAt: string;
};

type MemEndpoint = {
  id: string;
  userId: string;
  url: string;
  eventsCsv: string;
  enabled: boolean;
  secret: string;
  createdAt: Date;
  updatedAt: Date;
};

type MemDelivery = {
  id: string;
  endpointId: string;
  eventId: string;
  attempt: number;
  httpStatus: number | null;
  error: string | null;
  durationMs: number | null;
  nextRetryAt: Date | null;
  createdAt: Date;
};

const memEndpointsByUser = new Map<string, MemEndpoint[]>();
const memDeliveriesByEndpoint = new Map<string, MemDelivery[]>();

function parseEventsCsv(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function endpointToPublic(e: { id: string; userId: string; url: string; eventsCsv: string; enabled: boolean; createdAt: Date; updatedAt: Date }): WebhookEndpointPublic {
  return {
    id: e.id,
    userId: e.userId,
    url: e.url,
    events: parseEventsCsv(e.eventsCsv),
    enabled: e.enabled,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function deliveryToPublic(d: MemDelivery): WebhookDeliveryPublic {
  return {
    id: d.id,
    endpointId: d.endpointId,
    eventId: d.eventId,
    attempt: d.attempt,
    httpStatus: d.httpStatus,
    error: d.error,
    durationMs: d.durationMs,
    nextRetryAt: d.nextRetryAt ? d.nextRetryAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

async function recordDeliveryDb(d: DeliveryRecord): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    const db = getDb();
    await db.insert(schema.publicWebhookDeliveries).values({
      id: d.id,
      endpointId: d.endpointId,
      eventId: d.eventId,
      attempt: d.attempt,
      httpStatus: d.httpStatus,
      error: d.error,
      durationMs: d.durationMs,
      nextRetryAt: d.nextRetryAt,
      createdAt: d.createdAt,
    });
  } catch {
    void 0;
  }
}

function recordDeliveryMem(d: DeliveryRecord): void {
  const list = memDeliveriesByEndpoint.get(d.endpointId) ?? [];
  const mem: MemDelivery = {
    id: d.id,
    endpointId: d.endpointId,
    eventId: d.eventId,
    attempt: d.attempt,
    httpStatus: d.httpStatus,
    error: d.error,
    durationMs: d.durationMs,
    nextRetryAt: d.nextRetryAt,
    createdAt: d.createdAt,
  };
  memDeliveriesByEndpoint.set(d.endpointId, [mem, ...list].slice(0, 2000));
}

async function getDbEndpointsForUser(userId: string): Promise<(typeof schema.publicWebhookEndpoints.$inferSelect)[] | null> {
  if (!process.env.DATABASE_URL?.trim()) return null;
  try {
    const db = getDb();
    return await db.select().from(schema.publicWebhookEndpoints).where(eq(schema.publicWebhookEndpoints.userId, userId));
  } catch {
    return null;
  }
}

export async function listWebhookEndpoints(userId: string): Promise<WebhookEndpointPublic[]> {
  const dbRows = await getDbEndpointsForUser(userId);
  if (dbRows) {
    return dbRows.map((r) =>
      endpointToPublic({ id: r.id, userId: r.userId, url: r.url, eventsCsv: r.eventsCsv, enabled: r.enabled, createdAt: r.createdAt, updatedAt: r.updatedAt }),
    );
  }
  return (memEndpointsByUser.get(userId) ?? []).map(endpointToPublic);
}

export async function createWebhookEndpoint(input: {
  userId: string;
  url: string;
  events: string[];
  enabled: boolean;
}): Promise<{ endpoint: WebhookEndpointPublic; secret: string } | null> {
  const url = input.url.trim().slice(0, 800);
  const eventsCsv = input.events.map((e) => e.trim()).filter(Boolean).slice(0, 50).join(',');
  const enabled = Boolean(input.enabled);
  const secret = `whsec_${nanoid(32)}`;
  let secretHash: string;
  try {
    secretHash = hashWebhookSecret(secret);
  } catch {
    return null;
  }
  const now = new Date();

  if (process.env.DATABASE_URL?.trim()) {
    const secretEncrypted = await encryptForDb(secret);
    if (!secretEncrypted) return null;
    try {
      const db = getDb();
      const [row] = await db
        .insert(schema.publicWebhookEndpoints)
        .values({ userId: input.userId, url, secretHash, secretEncrypted, eventsCsv, enabled })
        .returning();
      return {
        endpoint: endpointToPublic({ id: row.id, userId: row.userId, url: row.url, eventsCsv: row.eventsCsv, enabled: row.enabled, createdAt: row.createdAt, updatedAt: row.updatedAt }),
        secret,
      };
    } catch {
      void 0;
    }
  }

  const id = randomUUID();
  const mem: MemEndpoint = { id, userId: input.userId, url, eventsCsv, enabled, secret, createdAt: now, updatedAt: now };
  memEndpointsByUser.set(input.userId, [...(memEndpointsByUser.get(input.userId) ?? []), mem]);
  return { endpoint: endpointToPublic(mem), secret };
}

export async function deleteWebhookEndpoint(userId: string, endpointId: string): Promise<boolean> {
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const db = getDb();
      const rows = await db.delete(schema.publicWebhookEndpoints).where(eq(schema.publicWebhookEndpoints.id, endpointId)).returning();
      return rows.some((r) => r.userId === userId);
    } catch {
      void 0;
    }
  }

  const list = memEndpointsByUser.get(userId) ?? [];
  const next = list.filter((e) => e.id !== endpointId);
  if (next.length === list.length) return false;
  memEndpointsByUser.set(userId, next);
  return true;
}

export async function listWebhookDeliveries(userId: string, endpointId: string, limit: number): Promise<WebhookDeliveryPublic[]> {
  const lim = Math.min(200, Math.max(1, Math.floor(limit || 50)));
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const db = getDb();
      const [owned] = await db.select().from(schema.publicWebhookEndpoints).where(eq(schema.publicWebhookEndpoints.id, endpointId));
      if (!owned || owned.userId !== userId) return [];
      const rows = await db
        .select()
        .from(schema.publicWebhookDeliveries)
        .where(eq(schema.publicWebhookDeliveries.endpointId, endpointId))
        .orderBy(desc(schema.publicWebhookDeliveries.createdAt))
        .limit(lim);
      return rows.map((r) =>
        deliveryToPublic({
          id: r.id,
          endpointId: r.endpointId,
          eventId: r.eventId,
          attempt: r.attempt,
          httpStatus: r.httpStatus ?? null,
          error: r.error ?? null,
          durationMs: r.durationMs ?? null,
          nextRetryAt: r.nextRetryAt ?? null,
          createdAt: r.createdAt,
        }),
      );
    } catch {
      void 0;
    }
  }

  const endpoint = (memEndpointsByUser.get(userId) ?? []).find((e) => e.id === endpointId);
  if (!endpoint) return [];
  return (memDeliveriesByEndpoint.get(endpointId) ?? []).slice(0, lim).map(deliveryToPublic);
}

export async function emitWebhookEvent(userId: string, type: string, payload: unknown): Promise<void> {
  const eventType = type.trim().slice(0, 80);
  const eventId = randomUUID();

  if (process.env.DATABASE_URL?.trim()) {
    try {
      const db = getDb();
      const [row] = await db.insert(schema.publicWebhookEvents).values({ userId, type: eventType, payload }).returning();
      if (row?.id) {
        await dispatchForUser(userId, row.id, eventType, payload);
        return;
      }
    } catch {
      void 0;
    }
  }

  await dispatchForUser(userId, eventId, eventType, payload);
}

async function dispatchForUser(userId: string, eventId: string, eventType: string, payload: unknown): Promise<void> {
  const endpointsDb = await getDbEndpointsForUser(userId);
  if (endpointsDb) {
    for (const ep of endpointsDb) {
      if (!ep.enabled) continue;
      const events = parseEventsCsv(ep.eventsCsv);
      if (events.length && !events.includes(eventType)) continue;
      const secret = await decryptWebhookSecret(ep.secretEncrypted ?? null);
      if (!secret) continue;
      void dispatchWithRetry({
        endpointId: ep.id,
        endpointUrl: ep.url,
        secret,
        eventId,
        eventType,
        payload,
        onRecord: async (d) => {
          recordDeliveryMem(d);
          await recordDeliveryDb(d);
        },
      });
    }
    return;
  }

  for (const ep of memEndpointsByUser.get(userId) ?? []) {
    if (!ep.enabled) continue;
    const events = parseEventsCsv(ep.eventsCsv);
    if (events.length && !events.includes(eventType)) continue;
    void dispatchWithRetry({
      endpointId: ep.id,
      endpointUrl: ep.url,
      secret: ep.secret,
      eventId,
      eventType,
      payload,
      onRecord: (d) => {
        recordDeliveryMem(d);
      },
    });
  }
}
