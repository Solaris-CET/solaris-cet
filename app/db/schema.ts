import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/** Matches domain: BUY / SELL / MINE */
export const transactionTypeEnum = pgEnum('transaction_type', ['BUY', 'SELL', 'MINE']);

/** User — wallet, referral, points */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletAddress: text('wallet_address').notNull().unique(),
    referralCode: text('referral_code').unique(),
    points: integer('points').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('users_wallet_address_idx').on(t.walletAddress)],
);

/** Active or historical mining session per user */
export const miningSessions = pgTable(
  'mining_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    lastCheck: timestamp('last_check', { withTimezone: true }).notNull(),
    isRunning: boolean('is_running').notNull().default(false),
    minedAmount: numeric('mined_amount', { precision: 36, scale: 18 }).notNull().default('0'),
  },
  (t) => [index('mining_sessions_user_id_idx').on(t.userId)],
);

/** On-chain / app transactions */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: transactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 36, scale: 18 }).notNull(),
    status: text('status').notNull(),
    txHash: text('tx_hash'),
  },
  (t) => [index('transactions_user_id_idx').on(t.userId)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletAddress: text('wallet_address'),
    action: text('action').notNull(),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_logs_wallet_address_idx').on(t.walletAddress)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MiningSession = typeof miningSessions.$inferSelect;
export type NewMiningSession = typeof miningSessions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
