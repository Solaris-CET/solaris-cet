import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { getDb, schema } from '../../db/client';
import { sha256Hex } from './nodeCrypto';

export type ApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  revoked: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

type StoredKey = {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  revoked: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
};

const memKeysByHash = new Map<string, StoredKey>();
const memKeysByUser = new Map<string, StoredKey[]>();

function isProd(): boolean {
  return String(process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

function pepper(): string {
  const p = String(process.env.PUBLIC_API_KEY_PEPPER ?? '').trim();
  if (p) return p;
  const e = String(process.env.ENCRYPTION_SECRET ?? '').trim();
  if (e) return e;
  if (!isProd()) return 'dev-pepper';
  throw new Error('PUBLIC_API_KEY_PEPPER is required in production');
}

export function hashApiKey(rawKey: string): string {
  const key = rawKey.trim();
  return sha256Hex(`${pepper()}:${key}`);
}

function recordToPublic(k: StoredKey): ApiKeyRecord {
  return {
    id: k.id,
    userId: k.userId,
    name: k.name,
    prefix: k.prefix,
    revoked: k.revoked,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
  };
}

function createRawKey(): { raw: string; prefix: string } {
  const token = nanoid(36);
  const raw = `cet_sk_${token}`;
  return { raw, prefix: raw.slice(0, 10) };
}

function memInsertKey(k: StoredKey) {
  memKeysByHash.set(k.keyHash, k);
  memKeysByUser.set(k.userId, [...(memKeysByUser.get(k.userId) ?? []), k]);
}

function memUpdateUserKeys(userId: string, patch: (k: StoredKey) => StoredKey) {
  const list = memKeysByUser.get(userId) ?? [];
  const updated = list.map(patch);
  memKeysByUser.set(userId, updated);
  for (const k of updated) memKeysByHash.set(k.keyHash, k);
}

export async function createApiKey(userId: string, name: string): Promise<{ apiKey: ApiKeyRecord; rawKey: string }> {
  const { raw, prefix } = createRawKey();
  let keyHash: string;
  try {
    keyHash = hashApiKey(raw);
  } catch {
    throw new Error('API key hashing not configured');
  }
  const createdAt = new Date();

  const dbOk = Boolean(process.env.DATABASE_URL?.trim());
  if (dbOk) {
    try {
      const db = getDb();
      const [row] = await db
        .insert(schema.publicApiKeys)
        .values({ userId, name: name.slice(0, 120), prefix, keyHash, revoked: false })
        .returning();
      return { apiKey: recordToPublic({ ...row, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt }), rawKey: raw };
    } catch {
      void 0;
    }
  }

  const id = randomUUID();
  const stored: StoredKey = { id, userId, name: name.slice(0, 120), prefix, keyHash, revoked: false, createdAt, lastUsedAt: null };
  memInsertKey(stored);
  return { apiKey: recordToPublic(stored), rawKey: raw };
}

export async function listApiKeys(userId: string): Promise<ApiKeyRecord[]> {
  const dbOk = Boolean(process.env.DATABASE_URL?.trim());
  if (dbOk) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.publicApiKeys)
        .where(eq(schema.publicApiKeys.userId, userId));
      return rows.map((r) =>
        recordToPublic({
          id: r.id,
          userId: r.userId,
          name: r.name,
          prefix: r.prefix,
          keyHash: r.keyHash,
          revoked: r.revoked,
          createdAt: r.createdAt,
          lastUsedAt: r.lastUsedAt,
        }),
      );
    } catch {
      void 0;
    }
  }
  return (memKeysByUser.get(userId) ?? []).map(recordToPublic);
}

export async function revokeApiKey(userId: string, apiKeyId: string): Promise<boolean> {
  const dbOk = Boolean(process.env.DATABASE_URL?.trim());
  if (dbOk) {
    try {
      const db = getDb();
      const rows = await db
        .update(schema.publicApiKeys)
        .set({ revoked: true })
        .where(eq(schema.publicApiKeys.id, apiKeyId))
        .returning();
      return rows.some((r) => r.userId === userId);
    } catch {
      void 0;
    }
  }

  const list = memKeysByUser.get(userId) ?? [];
  const exists = list.some((k) => k.id === apiKeyId);
  if (!exists) return false;
  memUpdateUserKeys(userId, (k) => (k.id === apiKeyId ? { ...k, revoked: true } : k));
  return true;
}

export async function rotateApiKey(userId: string, apiKeyId: string): Promise<{ apiKey: ApiKeyRecord; rawKey: string } | null> {
  const existing = await getApiKeyById(userId, apiKeyId);
  if (!existing) return null;
  await revokeApiKey(userId, apiKeyId);
  return createApiKey(userId, `${existing.name} (rotated)`);
}

export async function verifyApiKey(rawKey: string): Promise<StoredKey | null> {
  const key = rawKey.trim();
  if (!key) return null;
  let keyHash: string;
  try {
    keyHash = hashApiKey(key);
  } catch {
    return null;
  }

  const dbOk = Boolean(process.env.DATABASE_URL?.trim());
  if (dbOk) {
    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.publicApiKeys)
        .where(eq(schema.publicApiKeys.keyHash, keyHash));
      if (!row) return null;
      if (row.revoked) return null;
      const now = new Date();
      await db
        .update(schema.publicApiKeys)
        .set({ lastUsedAt: now })
        .where(eq(schema.publicApiKeys.id, row.id));
      return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        prefix: row.prefix,
        keyHash: row.keyHash,
        revoked: row.revoked,
        createdAt: row.createdAt,
        lastUsedAt: now,
      };
    } catch {
      void 0;
    }
  }

  const mem = memKeysByHash.get(keyHash);
  if (!mem || mem.revoked) return null;
  mem.lastUsedAt = new Date();
  memInsertKey(mem);
  return mem;
}

export async function getApiKeyById(userId: string, apiKeyId: string): Promise<ApiKeyRecord | null> {
  const dbOk = Boolean(process.env.DATABASE_URL?.trim());
  if (dbOk) {
    try {
      const db = getDb();
      const [row] = await db
        .select()
        .from(schema.publicApiKeys)
        .where(eq(schema.publicApiKeys.id, apiKeyId));
      if (!row || row.userId !== userId) return null;
      return recordToPublic({
        id: row.id,
        userId: row.userId,
        name: row.name,
        prefix: row.prefix,
        keyHash: row.keyHash,
        revoked: row.revoked,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt,
      });
    } catch {
      void 0;
    }
  }
  const list = memKeysByUser.get(userId) ?? [];
  const found = list.find((k) => k.id === apiKeyId);
  return found ? recordToPublic(found) : null;
}
