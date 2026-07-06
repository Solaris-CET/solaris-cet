CREATE TYPE "public"."crm_conversation_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."crm_message_sender" AS ENUM('visitor', 'user', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."email_outbox_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."newsletter_status" AS ENUM('pending', 'active', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'push');--> statement-breakpoint
CREATE TYPE "public"."price_alert_direction" AS ENUM('above', 'below');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"user_id" uuid,
	"status" "crm_conversation_status" DEFAULT 'open' NOT NULL,
	"page_url" text,
	"utm" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender" "crm_message_sender" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" text NOT NULL,
	"template" text NOT NULL,
	"subject" text NOT NULL,
	"html" text NOT NULL,
	"text_body" text,
	"payload" jsonb,
	"status" "email_outbox_status" DEFAULT 'pending' NOT NULL,
	"send_after" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "newsletter_status" DEFAULT 'pending' NOT NULL,
	"verify_token" text NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"locale" text,
	"verified_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriptions_verify_token_unique" UNIQUE("verify_token"),
	CONSTRAINT "newsletter_subscriptions_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"marketing_newsletter" boolean DEFAULT false NOT NULL,
	"price_alerts_email" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset" text DEFAULT 'CET' NOT NULL,
	"direction" "price_alert_direction" NOT NULL,
	"target_usd" numeric(36, 18) NOT NULL,
	"channel" "notification_channel" DEFAULT 'email' NOT NULL,
	"cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_conversations" ADD CONSTRAINT "crm_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_messages" ADD CONSTRAINT "crm_messages_conversation_id_crm_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."crm_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ADD CONSTRAINT "newsletter_subscriptions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_user_id_idx" ON "contacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "crm_conversations_status_idx" ON "crm_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_conversations_updated_at_idx" ON "crm_conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "crm_messages_conversation_id_idx" ON "crm_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "crm_messages_created_at_idx" ON "crm_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_outbox_status_idx" ON "email_outbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_outbox_send_after_idx" ON "email_outbox" USING btree ("send_after");--> statement-breakpoint
CREATE INDEX "newsletter_subscriptions_contact_id_idx" ON "newsletter_subscriptions" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "newsletter_subscriptions_status_idx" ON "newsletter_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_subscriptions_created_at_idx" ON "newsletter_subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_preferences_push_enabled_idx" ON "notification_preferences" USING btree ("push_enabled");--> statement-breakpoint
CREATE INDEX "price_alerts_user_id_idx" ON "price_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "price_alerts_last_sent_at_idx" ON "price_alerts" USING btree ("last_sent_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");