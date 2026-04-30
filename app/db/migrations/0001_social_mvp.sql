CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"email" text,
	"email_reminders_enabled" boolean DEFAULT false NOT NULL,
	"telegram_notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_links" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_links_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_link_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"dedupe_key" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"code_used" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"location" text,
	"join_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'yes' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" text DEFAULT 'global' NOT NULL,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_rooms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"resolution" text
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_reports" ADD CONSTRAINT "chat_reports_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_settings_email_idx" ON "user_settings" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "telegram_links_chat_id_idx" ON "telegram_links" USING btree ("chat_id");
--> statement-breakpoint
CREATE INDEX "telegram_link_codes_user_id_idx" ON "telegram_link_codes" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "telegram_link_codes_expires_at_idx" ON "telegram_link_codes" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "points_ledger_user_id_idx" ON "points_ledger" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "points_ledger_created_at_idx" ON "points_ledger" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_user_dedupe_idx" ON "points_ledger" USING btree ("user_id","dedupe_key");
--> statement-breakpoint
CREATE INDEX "referrals_referrer_user_id_idx" ON "referrals" USING btree ("referrer_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referred_user_id_unique" ON "referrals" USING btree ("referred_user_id");
--> statement-breakpoint
CREATE INDEX "share_events_user_id_idx" ON "share_events" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "share_events_user_day_url_platform_unique" ON "share_events" USING btree ("user_id","day","url","platform");
--> statement-breakpoint
CREATE INDEX "events_start_at_idx" ON "events" USING btree ("start_at");
--> statement-breakpoint
CREATE INDEX "event_rsvps_event_id_idx" ON "event_rsvps" USING btree ("event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "event_rsvps_event_user_unique" ON "event_rsvps" USING btree ("event_id","user_id");
--> statement-breakpoint
CREATE INDEX "chat_rooms_event_id_idx" ON "chat_rooms" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages" USING btree ("room_id");
--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "chat_reports_message_id_idx" ON "chat_reports" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "chat_reports_created_at_idx" ON "chat_reports" USING btree ("created_at");
