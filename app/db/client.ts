/**
 * PostgreSQL client for Node.js API routes (Coolify, etc.).
 * Do not import this from `runtime: 'edge'` handlers — Edge has no TCP to Postgres.
 * Use a Node runtime (or a serverless HTTP proxy) for routes that persist data.
 */
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

let sql: ReturnType<typeof postgres> | undefined;
let db: Database | undefined;

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error('DATABASE_URL is not set');
  }
  return url.trim();
}

/**
 * Singleton Drizzle instance. Reuses one connection pool per process (fine for Coolify / long-lived Node).
 */
export function getDb(): Database {
  if (!db) {
    sql = postgres(connectionString(), { max: 10 });
    db = drizzle(sql, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = undefined;
    db = undefined;
  }
}

export { schema };
