import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** Matches domain: BUY / SELL / MINE */
export const transactionTypeEnum = pgEnum('transaction_type', ['BUY', 'SELL', 'MINE']);

export const newsletterStatusEnum = pgEnum('newsletter_status', ['pending', 'active', 'unsubscribed']);
export const emailOutboxStatusEnum = pgEnum('email_outbox_status', ['pending', 'sent', 'failed']);
export const notificationChannelEnum = pgEnum('notification_channel', ['email', 'push']);
export const priceAlertDirectionEnum = pgEnum('price_alert_direction', ['above', 'below']);
export const crmConversationStatusEnum = pgEnum('crm_conversation_status', ['open', 'resolved']);
export const crmMessageSenderEnum = pgEnum('crm_message_sender', ['visitor', 'user', 'agent', 'system']);
export const web3IntentTypeEnum = pgEnum('web3_intent_type', ['stake', 'unstake', 'claim', 'vote', 'bridge', 'onramp']);
export const web3IntentStatusEnum = pgEnum('web3_intent_status', ['created', 'pending', 'confirmed', 'failed']);
export const questKindEnum = pgEnum('quest_kind', ['daily', 'seasonal', 'social']);
export const userQuestStatusEnum = pgEnum('user_quest_status', ['in_progress', 'completed', 'claimed', 'pending_review', 'rejected']);
export const badgeRarityEnum = pgEnum('badge_rarity', ['common', 'rare', 'epic', 'legendary']);
export const weeklyRewardStatusEnum = pgEnum('weekly_reward_status', ['pending', 'sent', 'failed']);
export const nftBadgeClaimStatusEnum = pgEnum('nft_badge_claim_status', ['requested', 'minted', 'failed']);
export const cetuiaTokenStatusEnum = pgEnum('cetuia_token_status', ['available', 'reserved', 'sold']);

/** User — wallet, referral, points */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletAddress: text('wallet_address').notNull().unique(),
    referralCode: text('referral_code').unique(),
    points: integer('points').notNull().default(0),
    role: text('role').notNull().default('visitor'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('users_wallet_address_idx').on(t.walletAddress)],
);

export const userSettings = pgTable(
  'user_settings',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    email: text('email'),
    emailRemindersEnabled: boolean('email_reminders_enabled').notNull().default(false),
    telegramNotificationsEnabled: boolean('telegram_notifications_enabled').notNull().default(true),
    locale: text('locale').notNull().default('ro'),
    theme: text('theme').notNull().default('dark'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_settings_email_idx').on(t.email)],
);

export const telegramLinks = pgTable(
  'telegram_links',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    chatId: text('chat_id').notNull().unique(),
    username: text('username'),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('telegram_links_chat_id_idx').on(t.chatId)],
);

export const telegramLinkCodes = pgTable(
  'telegram_link_codes',
  {
    code: text('code').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('telegram_link_codes_user_id_idx').on(t.userId), index('telegram_link_codes_expires_at_idx').on(t.expiresAt)],
);

export const telegramLoginIdentities = pgTable(
  'telegram_login_identities',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    telegramUserId: text('telegram_user_id').notNull().unique(),
    username: text('username'),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('telegram_login_identities_telegram_user_id_idx').on(t.telegramUserId)],
);

export const oauthIdentities = pgTable(
  'oauth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    username: text('username'),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('oauth_identities_provider_user_unique').on(t.provider, t.providerUserId),
    uniqueIndex('oauth_identities_provider_userId_unique').on(t.provider, t.userId),
    index('oauth_identities_user_id_idx').on(t.userId),
  ],
);

export const oauthStates = pgTable(
  'oauth_states',
  {
    state: text('state').primaryKey(),
    provider: text('provider').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    codeVerifier: text('code_verifier').notNull(),
    returnTo: text('return_to'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('oauth_states_expires_at_idx').on(t.expiresAt), index('oauth_states_user_id_idx').on(t.userId)],
);

export const userTonWallets = pgTable(
  'user_ton_wallets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    label: text('label'),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_ton_wallets_address_unique').on(t.address),
    index('user_ton_wallets_user_id_idx').on(t.userId),
    index('user_ton_wallets_user_primary_idx').on(t.userId, t.isPrimary),
  ],
);

export const pointsLedger = pgTable(
  'points_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    dedupeKey: text('dedupe_key'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('points_ledger_user_id_idx').on(t.userId),
    index('points_ledger_created_at_idx').on(t.createdAt),
    uniqueIndex('points_ledger_user_dedupe_idx').on(t.userId, t.dedupeKey),
  ],
);

export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    referrerUserId: uuid('referrer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredUserId: uuid('referred_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeUsed: text('code_used').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('referrals_referrer_user_id_idx').on(t.referrerUserId),
    uniqueIndex('referrals_referred_user_id_unique').on(t.referredUserId),
  ],
);

export const shareEvents = pgTable(
  'share_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    url: text('url').notNull(),
    day: text('day').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('share_events_user_id_idx').on(t.userId),
    uniqueIndex('share_events_user_day_url_platform_unique').on(t.userId, t.day, t.url, t.platform),
  ],
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),
    location: text('location'),
    joinUrl: text('join_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('events_start_at_idx').on(t.startAt)],
);

export const eventRsvps = pgTable(
  'event_rsvps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('yes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('event_rsvps_event_id_idx').on(t.eventId),
    uniqueIndex('event_rsvps_event_user_unique').on(t.eventId, t.userId),
  ],
);

export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    kind: text('kind').notNull().default('global'),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('chat_rooms_event_id_idx').on(t.eventId)],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('chat_messages_room_id_idx').on(t.roomId),
    index('chat_messages_created_at_idx').on(t.createdAt),
  ],
);

export const chatReports = pgTable(
  'chat_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
  },
  (t) => [index('chat_reports_message_id_idx').on(t.messageId), index('chat_reports_created_at_idx').on(t.createdAt)],
);

export const forumPosts = pgTable(
  'forum_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('forum_posts_author_user_id_idx').on(t.authorUserId),
    index('forum_posts_created_at_idx').on(t.createdAt),
    index('forum_posts_last_activity_at_idx').on(t.lastActivityAt),
  ],
);

export const forumComments = pgTable(
  'forum_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => forumPosts.id, { onDelete: 'cascade' }),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentCommentId: uuid('parent_comment_id'),
    body: text('body').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.parentCommentId],
      foreignColumns: [t.id],
      name: 'forum_comments_parent_comment_id_forum_comments_id_fk',
    }).onDelete('cascade'),
    index('forum_comments_post_id_idx').on(t.postId),
    index('forum_comments_author_user_id_idx').on(t.authorUserId),
    index('forum_comments_created_at_idx').on(t.createdAt),
  ],
);

export const forumVotes = pgTable(
  'forum_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    value: integer('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('forum_votes_target_idx').on(t.targetType, t.targetId),
    index('forum_votes_user_id_idx').on(t.userId),
    uniqueIndex('forum_votes_user_target_unique').on(t.userId, t.targetType, t.targetId),
  ],
);

export const forumReports = pgTable(
  'forum_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    targetType: text('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    details: text('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    resolution: text('resolution'),
  },
  (t) => [
    index('forum_reports_target_idx').on(t.targetType, t.targetId),
    index('forum_reports_created_at_idx').on(t.createdAt),
  ],
);

export const userMfa = pgTable(
  'user_mfa',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    secretEncrypted: text('secret_encrypted'),
    enabledAt: timestamp('enabled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_mfa_enabled_at_idx').on(t.enabledAt)],
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transactions_user_id_idx').on(t.userId)],
);

export const tonIndexedTransactions = pgTable(
  'ton_indexed_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    network: text('network').notNull(),
    address: text('address').notNull(),
    txHash: text('tx_hash').notNull(),
    kind: text('kind').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    raw: jsonb('raw'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ton_indexed_transactions_network_address_hash_unique').on(t.network, t.address, t.txHash),
    index('ton_indexed_transactions_network_address_time_idx').on(t.network, t.address, t.occurredAt),
  ],
);

/** Auth sessions (JWT issuance tracking / revocation) */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ip: text('ip'),
    userAgent: text('user_agent'),
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
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

export const consentProofs = pgTable(
  'consent_proofs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    consentKey: text('consent_key').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    essential: boolean('essential').notNull().default(true),
    analytics: boolean('analytics').notNull(),
    marketing: boolean('marketing').notNull(),
    policyVersion: text('policy_version').notNull(),
    policyHash: text('policy_hash'),
    source: text('source').notNull().default('unknown'),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('consent_proofs_consent_key_idx').on(t.consentKey),
    index('consent_proofs_user_id_idx').on(t.userId),
    index('consent_proofs_created_at_idx').on(t.createdAt),
  ],
);

export const publicApiKeys = pgTable(
  'public_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    keyHash: text('key_hash').notNull(),
    revoked: boolean('revoked').notNull().default(false),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_api_keys_user_id_idx').on(t.userId),
    index('public_api_keys_key_hash_idx').on(t.keyHash),
    index('public_api_keys_last_used_at_idx').on(t.lastUsedAt),
  ],
);

export const publicWebhookEndpoints = pgTable(
  'public_webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    secretHash: text('secret_hash').notNull(),
    secretEncrypted: text('secret_encrypted'),
    eventsCsv: text('events_csv').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_webhook_endpoints_user_id_idx').on(t.userId),
    index('public_webhook_endpoints_enabled_idx').on(t.enabled),
  ],
);

export const publicWebhookEvents = pgTable(
  'public_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_webhook_events_user_id_idx').on(t.userId),
    index('public_webhook_events_created_at_idx').on(t.createdAt),
    index('public_webhook_events_type_idx').on(t.type),
  ],
);

export const publicWebhookDeliveries = pgTable(
  'public_webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => publicWebhookEndpoints.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => publicWebhookEvents.id, { onDelete: 'cascade' }),
    attempt: integer('attempt').notNull().default(1),
    httpStatus: integer('http_status'),
    error: text('error'),
    durationMs: integer('duration_ms'),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_webhook_deliveries_endpoint_created_idx').on(t.endpointId, t.createdAt),
    index('public_webhook_deliveries_next_retry_idx').on(t.nextRetryAt),
    index('public_webhook_deliveries_event_id_idx').on(t.eventId),
  ],
);

export const publicApiUsage = pgTable(
  'public_api_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apiKeyId: uuid('api_key_id').references(() => publicApiKeys.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    method: text('method').notNull(),
    path: text('path').notNull(),
    status: integer('status').notNull(),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('public_api_usage_created_at_idx').on(t.createdAt),
    index('public_api_usage_api_key_id_idx').on(t.apiKeyId),
    index('public_api_usage_user_id_idx').on(t.userId),
    index('public_api_usage_path_idx').on(t.path),
  ],
);

export const adminRoleEnum = pgEnum('admin_role', ['admin', 'editor', 'viewer']);

export const adminAccounts = pgTable(
  'admin_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').notNull().default('viewer'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    mfaSecretEncrypted: text('mfa_secret_encrypted'),
    mfaEnabledAt: timestamp('mfa_enabled_at', { withTimezone: true }),
  },
  (t) => [index('admin_accounts_role_idx').on(t.role)],
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => adminAccounts.id, { onDelete: 'cascade' }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [index('admin_sessions_admin_id_idx').on(t.adminId), index('admin_sessions_expires_at_idx').on(t.expiresAt)],
);

export const adminInvites = pgTable(
  'admin_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull().unique(),
    role: adminRoleEnum('role').notNull(),
    maxUses: integer('max_uses').notNull().default(1),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdByAdminId: uuid('created_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('admin_invites_role_idx').on(t.role), index('admin_invites_expires_at_idx').on(t.expiresAt)],
);

export const quests = pgTable(
  'quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    kind: questKindEnum('kind').notNull(),
    actionKey: text('action_key').notNull(),
    targetCount: integer('target_count').notNull().default(1),
    pointsReward: integer('points_reward').notNull().default(0),
    requiresProof: boolean('requires_proof').notNull().default(false),
    seasonKey: text('season_key'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('quests_kind_active_idx').on(t.kind, t.active),
    index('quests_action_key_idx').on(t.actionKey),
    index('quests_starts_at_idx').on(t.startsAt),
  ],
);

export const userQuestProgress = pgTable(
  'user_quest_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questId: uuid('quest_id')
      .notNull()
      .references(() => quests.id, { onDelete: 'cascade' }),
    day: text('day').notNull().default(''),
    progress: integer('progress').notNull().default(0),
    status: userQuestStatusEnum('status').notNull().default('in_progress'),
    proofUrl: text('proof_url'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('user_quest_progress_user_id_idx').on(t.userId),
    index('user_quest_progress_quest_id_idx').on(t.questId),
    uniqueIndex('user_quest_progress_user_quest_day_unique').on(t.userId, t.questId, t.day),
    index('user_quest_progress_status_idx').on(t.status),
  ],
);

export const userStreaks = pgTable(
  'user_streaks',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastActiveDay: text('last_active_day'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_streaks_current_streak_idx').on(t.currentStreak)],
);

export const badges = pgTable(
  'badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    rarity: badgeRarityEnum('rarity').notNull().default('common'),
    pointsBonus: integer('points_bonus').notNull().default(0),
    tonMetadataUri: text('ton_metadata_uri'),
    active: boolean('active').notNull().default(true),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('badges_rarity_idx').on(t.rarity), index('badges_active_idx').on(t.active)],
);

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb('meta'),
  },
  (t) => [
    index('user_badges_user_id_idx').on(t.userId),
    index('user_badges_badge_id_idx').on(t.badgeId),
    uniqueIndex('user_badges_user_badge_unique').on(t.userId, t.badgeId),
  ],
);

export const nftBadgeClaims = pgTable(
  'nft_badge_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    status: nftBadgeClaimStatusEnum('status').notNull().default('requested'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    mintedAt: timestamp('minted_at', { withTimezone: true }),
    txHash: text('tx_hash'),
    nftAddress: text('nft_address'),
    meta: jsonb('meta'),
  },
  (t) => [
    index('nft_badge_claims_user_id_idx').on(t.userId),
    index('nft_badge_claims_status_idx').on(t.status),
    uniqueIndex('nft_badge_claims_user_badge_unique').on(t.userId, t.badgeId),
  ],
);

export const shopItems = pgTable(
  'shop_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    kind: text('kind').notNull(),
    costPoints: integer('cost_points').notNull(),
    active: boolean('active').notNull().default(true),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('shop_items_active_idx').on(t.active), index('shop_items_kind_idx').on(t.kind)],
);

export const userInventory = pgTable(
  'user_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: uuid('item_id')
      .notNull()
      .references(() => shopItems.id, { onDelete: 'cascade' }),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
    equipped: boolean('equipped').notNull().default(false),
    meta: jsonb('meta'),
  },
  (t) => [
    index('user_inventory_user_id_idx').on(t.userId),
    index('user_inventory_item_id_idx').on(t.itemId),
    uniqueIndex('user_inventory_user_item_unique').on(t.userId, t.itemId),
  ],
);

export const wheelSpins = pgTable(
  'wheel_spins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    rewardPoints: integer('reward_points').notNull(),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('wheel_spins_user_id_idx').on(t.userId),
    uniqueIndex('wheel_spins_user_day_unique').on(t.userId, t.day),
  ],
);

export const affiliateLinks = pgTable(
  'affiliate_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: text('code').notNull().unique(),
    active: boolean('active').notNull().default(true),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('affiliate_links_user_id_idx').on(t.userId), index('affiliate_links_active_idx').on(t.active)],
);

export const affiliateClicksDaily = pgTable(
  'affiliate_clicks_daily',
  {
    affiliateLinkId: uuid('affiliate_link_id')
      .notNull()
      .references(() => affiliateLinks.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    count: integer('count').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('affiliate_clicks_daily_link_day_unique').on(t.affiliateLinkId, t.day),
    index('affiliate_clicks_daily_day_idx').on(t.day),
  ],
);

export const userInvites = pgTable(
  'user_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: text('token_hash').notNull().unique(),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    maxUses: integer('max_uses').notNull().default(1),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('user_invites_created_by_idx').on(t.createdByUserId), index('user_invites_expires_at_idx').on(t.expiresAt)],
);

export const userInviteUses = pgTable(
  'user_invite_uses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inviteId: uuid('invite_id')
      .notNull()
      .references(() => userInvites.id, { onDelete: 'cascade' }),
    usedByUserId: uuid('used_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb('meta'),
  },
  (t) => [
    index('user_invite_uses_invite_id_idx').on(t.inviteId),
    index('user_invite_uses_used_by_user_id_idx').on(t.usedByUserId),
    uniqueIndex('user_invite_uses_invite_user_unique').on(t.inviteId, t.usedByUserId),
  ],
);

export const weeklyLeaderboards = pgTable(
  'weekly_leaderboards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weekStart: text('week_start').notNull().unique(),
    weekEnd: text('week_end').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('weekly_leaderboards_generated_at_idx').on(t.generatedAt)],
);

export const weeklyLeaderboardEntries = pgTable(
  'weekly_leaderboard_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaderboardId: uuid('leaderboard_id')
      .notNull()
      .references(() => weeklyLeaderboards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    pointsEarned: integer('points_earned').notNull(),
    totalPoints: integer('total_points').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('weekly_leaderboard_entries_leaderboard_id_idx').on(t.leaderboardId),
    index('weekly_leaderboard_entries_user_id_idx').on(t.userId),
    uniqueIndex('weekly_leaderboard_entries_leaderboard_user_unique').on(t.leaderboardId, t.userId),
    uniqueIndex('weekly_leaderboard_entries_leaderboard_rank_unique').on(t.leaderboardId, t.rank),
  ],
);

export const weeklyRewards = pgTable(
  'weekly_rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leaderboardId: uuid('leaderboard_id')
      .notNull()
      .references(() => weeklyLeaderboards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    cetAmount: numeric('cet_amount', { precision: 36, scale: 18 }).notNull(),
    status: weeklyRewardStatusEnum('status').notNull().default('pending'),
    txHash: text('tx_hash'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('weekly_rewards_leaderboard_id_idx').on(t.leaderboardId),
    index('weekly_rewards_user_id_idx').on(t.userId),
    index('weekly_rewards_status_idx').on(t.status),
    uniqueIndex('weekly_rewards_leaderboard_user_unique').on(t.leaderboardId, t.userId),
  ],
);

export const cmsBlocks = pgTable(
  'cms_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    locale: text('locale').notNull().default('ro'),
    format: text('format').notNull().default('plain'),
    content: text('content').notNull().default(''),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('cms_blocks_key_locale_unique').on(t.key, t.locale), index('cms_blocks_locale_idx').on(t.locale)],
);

export const cmsAssets = pgTable(
  'cms_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    bytes: integer('bytes').notNull().default(0),
    dataBase64: text('data_base64').notNull(),
    createdByAdminId: uuid('created_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cms_assets_created_at_idx').on(t.createdAt)],
);

export const cmsPosts = pgTable(
  'cms_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    locale: text('locale').notNull().default('ro'),
    status: text('status').notNull().default('draft'),
    markdown: text('markdown').notNull().default(''),
    coverAssetId: uuid('cover_asset_id').references(() => cmsAssets.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdByAdminId: uuid('created_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cms_posts_locale_status_idx').on(t.locale, t.status), index('cms_posts_updated_at_idx').on(t.updatedAt)],
);

export const cmsTranslations = pgTable(
  'cms_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: text('locale').notNull(),
    namespace: text('namespace').notNull().default('common'),
    key: text('key').notNull(),
    value: text('value').notNull(),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cms_translations_unique').on(t.locale, t.namespace, t.key),
    index('cms_translations_locale_ns_idx').on(t.locale, t.namespace),
  ],
);

export const cmsSettings = pgTable(
  'cms_settings',
  {
    key: text('key').primaryKey(),
    value: jsonb('value').notNull(),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cms_settings_updated_at_idx').on(t.updatedAt)],
);

export const cmsTokenData = pgTable(
  'cms_token_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    symbol: text('symbol').notNull().unique(),
    priceUsd: numeric('price_usd', { precision: 36, scale: 18 }).notNull().default('0'),
    totalSupply: numeric('total_supply', { precision: 36, scale: 18 }).notNull().default('0'),
    circulatingSupply: numeric('circulating_supply', { precision: 36, scale: 18 }).notNull().default('0'),
    updatedByAdminId: uuid('updated_by_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cms_token_data_symbol_idx').on(t.symbol)],
);

export const cetuiaTokens = pgTable(
  'cetuia_tokens',
  {
    id: integer('id').primaryKey(),
    status: cetuiaTokenStatusEnum('status').notNull().default('available'),
    ownerWalletAddress: text('owner_wallet_address'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('cetuia_tokens_status_idx').on(t.status), index('cetuia_tokens_owner_idx').on(t.ownerWalletAddress)],
);

export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorAdminId: uuid('actor_admin_id').references(() => adminAccounts.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    meta: jsonb('meta').notNull().default({}),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('admin_audit_logs_created_at_idx').on(t.createdAt), index('admin_audit_logs_actor_idx').on(t.actorAdminId)],
);

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    modelPreference: text('model_preference').notNull().default('auto'),
    customInstructions: text('custom_instructions'),
    tone: text('tone').notNull().default('brand'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [
    index('ai_conversations_user_id_idx').on(t.userId),
    index('ai_conversations_last_message_at_idx').on(t.lastMessageAt),
  ],
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    revisionOf: uuid('revision_of'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_messages_conversation_id_idx').on(t.conversationId),
    index('ai_messages_created_at_idx').on(t.createdAt),
    index('ai_messages_revision_of_idx').on(t.revisionOf),
  ],
);

export const aiAttachments = pgTable(
  'ai_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    bytes: integer('bytes').notNull().default(0),
    dataBase64: text('data_base64').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ai_attachments_user_id_idx').on(t.userId), index('ai_attachments_created_at_idx').on(t.createdAt)],
);

export const aiMessageAttachments = pgTable(
  'ai_message_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => aiMessages.id, { onDelete: 'cascade' }),
    attachmentId: uuid('attachment_id')
      .notNull()
      .references(() => aiAttachments.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('ai_message_attachments_unique').on(t.messageId, t.attachmentId),
    index('ai_message_attachments_message_id_idx').on(t.messageId),
    index('ai_message_attachments_attachment_id_idx').on(t.attachmentId),
  ],
);

export const aiPins = pgTable(
  'ai_pins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => aiMessages.id, { onDelete: 'cascade' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_pins_user_id_idx').on(t.userId),
    index('ai_pins_message_id_idx').on(t.messageId),
  ],
);

export const aiReports = pgTable(
  'ai_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    messageId: uuid('message_id').references(() => aiMessages.id, { onDelete: 'set null' }),
    queryHash: text('query_hash'),
    responseHash: text('response_hash'),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_reports_user_id_idx').on(t.userId),
    index('ai_reports_status_idx').on(t.status),
    index('ai_reports_created_at_idx').on(t.createdAt),
  ],
);

export const aiQueryLogs = pgTable(
  'ai_query_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    ipHash: text('ip_hash'),
    query: text('query').notNull(),
    queryHash: text('query_hash').notNull(),
    model: text('model').notNull(),
    plan: text('plan').notNull().default('auto'),
    source: text('source').notNull().default('live'),
    latencyMs: integer('latency_ms'),
    usedCache: boolean('used_cache').notNull().default(false),
    moderationFlagged: boolean('moderation_flagged').notNull().default(false),
    responseHash: text('response_hash'),
    qualityScore: integer('quality_score'),
    evalModel: text('eval_model'),
    evalLatencyMs: integer('eval_latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_query_logs_user_id_idx').on(t.userId),
    index('ai_query_logs_query_hash_idx').on(t.queryHash),
    index('ai_query_logs_created_at_idx').on(t.createdAt),
  ],
);

export const aiFeedback = pgTable(
  'ai_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    queryLogId: uuid('query_log_id').references(() => aiQueryLogs.id, { onDelete: 'set null' }),
    messageId: uuid('message_id').references(() => aiMessages.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_feedback_created_at_idx').on(t.createdAt),
    index('ai_feedback_user_id_idx').on(t.userId),
    index('ai_feedback_query_log_id_idx').on(t.queryLogId),
    index('ai_feedback_message_id_idx').on(t.messageId),
  ],
);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    anonId: text('anon_id').notNull(),
    sessionId: text('session_id').notNull(),
    name: text('name').notNull(),
    props: jsonb('props'),
    pagePath: text('page_path'),
    referrer: text('referrer'),
    uaHash: text('ua_hash'),
    ipHash: text('ip_hash'),
    day: text('day').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('analytics_events_created_at_idx').on(t.createdAt),
    index('analytics_events_day_idx').on(t.day),
    index('analytics_events_user_id_idx').on(t.userId),
    index('analytics_events_anon_id_idx').on(t.anonId),
    index('analytics_events_session_id_idx').on(t.sessionId),
    index('analytics_events_name_idx').on(t.name),
  ],
);

export const aiVectorDocs = pgTable(
  'ai_vector_docs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    kind: text('kind').notNull().default('qa'),
    text: text('text').notNull(),
    embedding: jsonb('embedding').notNull(),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ai_vector_docs_user_id_idx').on(t.userId),
    index('ai_vector_docs_created_at_idx').on(t.createdAt),
    index('ai_vector_docs_kind_idx').on(t.kind),
  ],
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').unique(),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('contacts_user_id_idx').on(t.userId), index('contacts_email_idx').on(t.email)],
);

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    status: newsletterStatusEnum('status').notNull().default('pending'),
    verifyToken: text('verify_token').notNull().unique(),
    unsubscribeToken: text('unsubscribe_token').notNull().unique(),
    locale: text('locale'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('newsletter_subscriptions_contact_id_idx').on(t.contactId),
    index('newsletter_subscriptions_status_idx').on(t.status),
    index('newsletter_subscriptions_created_at_idx').on(t.createdAt),
  ],
);

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    marketingNewsletter: boolean('marketing_newsletter').notNull().default(false),
    priceAlertsEmail: boolean('price_alerts_email').notNull().default(false),
    pushEnabled: boolean('push_enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notification_preferences_push_enabled_idx').on(t.pushEnabled)],
);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('push_subscriptions_user_id_idx').on(t.userId)],
);

export const priceAlerts = pgTable(
  'price_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    asset: text('asset').notNull().default('CET'),
    direction: priceAlertDirectionEnum('direction').notNull(),
    targetUsd: numeric('target_usd', { precision: 36, scale: 18 }).notNull(),
    channel: notificationChannelEnum('channel').notNull().default('email'),
    cooldownMinutes: integer('cooldown_minutes').notNull().default(60),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('price_alerts_user_id_idx').on(t.userId),
    index('price_alerts_last_sent_at_idx').on(t.lastSentAt),
  ],
);

export const emailOutbox = pgTable(
  'email_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toEmail: text('to_email').notNull(),
    template: text('template').notNull(),
    subject: text('subject').notNull(),
    html: text('html').notNull(),
    textBody: text('text_body'),
    payload: jsonb('payload'),
    status: emailOutboxStatusEnum('status').notNull().default('pending'),
    sendAfter: timestamp('send_after', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('email_outbox_status_idx').on(t.status),
    index('email_outbox_send_after_idx').on(t.sendAfter),
  ],
);

export const crmConversations = pgTable(
  'crm_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    status: crmConversationStatusEnum('status').notNull().default('open'),
    pageUrl: text('page_url'),
    utm: jsonb('utm'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [index('crm_conversations_status_idx').on(t.status), index('crm_conversations_updated_at_idx').on(t.updatedAt)],
);

export const crmMessages = pgTable(
  'crm_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => crmConversations.id, { onDelete: 'cascade' }),
    sender: crmMessageSenderEnum('sender').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('crm_messages_conversation_id_idx').on(t.conversationId), index('crm_messages_created_at_idx').on(t.createdAt)],
);

export const web3Intents = pgTable(
  'web3_intents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: web3IntentTypeEnum('type').notNull(),
    status: web3IntentStatusEnum('status').notNull().default('created'),
    txHash: text('tx_hash'),
    providerRef: text('provider_ref'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('web3_intents_user_id_idx').on(t.userId), index('web3_intents_created_at_idx').on(t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type TelegramLink = typeof telegramLinks.$inferSelect;
export type NewTelegramLink = typeof telegramLinks.$inferInsert;
export type TelegramLinkCode = typeof telegramLinkCodes.$inferSelect;
export type NewTelegramLinkCode = typeof telegramLinkCodes.$inferInsert;
export type PointsLedgerRow = typeof pointsLedger.$inferSelect;
export type NewPointsLedgerRow = typeof pointsLedger.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type ShareEvent = typeof shareEvents.$inferSelect;
export type NewShareEvent = typeof shareEvents.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type NewEventRsvp = typeof eventRsvps.$inferInsert;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type ChatReport = typeof chatReports.$inferSelect;
export type NewChatReport = typeof chatReports.$inferInsert;
export type UserMfa = typeof userMfa.$inferSelect;
export type NewUserMfa = typeof userMfa.$inferInsert;
export type MiningSession = typeof miningSessions.$inferSelect;
export type NewMiningSession = typeof miningSessions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type PublicApiKey = typeof publicApiKeys.$inferSelect;
export type NewPublicApiKey = typeof publicApiKeys.$inferInsert;
export type PublicWebhookEndpoint = typeof publicWebhookEndpoints.$inferSelect;
export type NewPublicWebhookEndpoint = typeof publicWebhookEndpoints.$inferInsert;
export type PublicWebhookEvent = typeof publicWebhookEvents.$inferSelect;
export type NewPublicWebhookEvent = typeof publicWebhookEvents.$inferInsert;
export type PublicWebhookDelivery = typeof publicWebhookDeliveries.$inferSelect;
export type NewPublicWebhookDelivery = typeof publicWebhookDeliveries.$inferInsert;
export type PublicApiUsage = typeof publicApiUsage.$inferSelect;
export type NewPublicApiUsage = typeof publicApiUsage.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type NewAiConversation = typeof aiConversations.$inferInsert;
export type AiMessage = typeof aiMessages.$inferSelect;
export type NewAiMessage = typeof aiMessages.$inferInsert;
export type AiPin = typeof aiPins.$inferSelect;
export type NewAiPin = typeof aiPins.$inferInsert;
export type AiReport = typeof aiReports.$inferSelect;
export type NewAiReport = typeof aiReports.$inferInsert;
export type AiQueryLog = typeof aiQueryLogs.$inferSelect;
export type NewAiQueryLog = typeof aiQueryLogs.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type AiVectorDoc = typeof aiVectorDocs.$inferSelect;
export type NewAiVectorDoc = typeof aiVectorDocs.$inferInsert;

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type NewPriceAlert = typeof priceAlerts.$inferInsert;
export type EmailOutbox = typeof emailOutbox.$inferSelect;
export type NewEmailOutbox = typeof emailOutbox.$inferInsert;
export type CrmConversation = typeof crmConversations.$inferSelect;
export type NewCrmConversation = typeof crmConversations.$inferInsert;
export type CrmMessage = typeof crmMessages.$inferSelect;
export type NewCrmMessage = typeof crmMessages.$inferInsert;

export type Web3Intent = typeof web3Intents.$inferSelect;
export type NewWeb3Intent = typeof web3Intents.$inferInsert;
