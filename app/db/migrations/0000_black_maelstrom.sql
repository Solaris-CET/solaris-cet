CREATE TYPE "public"."transaction_type" AS ENUM('BUY', 'SELL', 'MINE');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"model_preference" text DEFAULT 'auto' NOT NULL,
	"custom_instructions" text,
	"tone" text DEFAULT 'brand' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"revision_of" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_pins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_query_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"ip_hash" text,
	"query" text NOT NULL,
	"query_hash" text NOT NULL,
	"model" text NOT NULL,
	"plan" text DEFAULT 'auto' NOT NULL,
	"source" text DEFAULT 'live' NOT NULL,
	"latency_ms" integer,
	"used_cache" boolean DEFAULT false NOT NULL,
	"moderation_flagged" boolean DEFAULT false NOT NULL,
	"response_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"message_id" uuid,
	"query_hash" text,
	"response_hash" text,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_vector_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"kind" text DEFAULT 'qa' NOT NULL,
	"text" text NOT NULL,
	"embedding" jsonb NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mining_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"last_check" timestamp with time zone NOT NULL,
	"is_running" boolean DEFAULT false NOT NULL,
	"mined_amount" numeric(36, 18) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text
);
--> statement-breakpoint
CREATE TABLE "user_mfa" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secret_encrypted" text,
	"enabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"referral_code" text,
	"points" integer DEFAULT 0 NOT NULL,
	"role" text DEFAULT 'visitor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_pins" ADD CONSTRAINT "ai_pins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_pins" ADD CONSTRAINT "ai_pins_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_query_logs" ADD CONSTRAINT "ai_query_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_vector_docs" ADD CONSTRAINT "ai_vector_docs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mining_sessions" ADD CONSTRAINT "mining_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mfa" ADD CONSTRAINT "user_mfa_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_last_message_at_idx" ON "ai_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_messages_revision_of_idx" ON "ai_messages" USING btree ("revision_of");--> statement-breakpoint
CREATE INDEX "ai_pins_user_id_idx" ON "ai_pins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_pins_message_id_idx" ON "ai_pins" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ai_query_logs_user_id_idx" ON "ai_query_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_query_logs_query_hash_idx" ON "ai_query_logs" USING btree ("query_hash");--> statement-breakpoint
CREATE INDEX "ai_query_logs_created_at_idx" ON "ai_query_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_reports_user_id_idx" ON "ai_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_reports_status_idx" ON "ai_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_reports_created_at_idx" ON "ai_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_vector_docs_user_id_idx" ON "ai_vector_docs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_vector_docs_created_at_idx" ON "ai_vector_docs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_vector_docs_kind_idx" ON "ai_vector_docs" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "audit_logs_wallet_address_idx" ON "audit_logs" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "mining_sessions_user_id_idx" ON "mining_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_mfa_enabled_at_idx" ON "user_mfa" USING btree ("enabled_at");--> statement-breakpoint
CREATE INDEX "users_wallet_address_idx" ON "users" USING btree ("wallet_address");