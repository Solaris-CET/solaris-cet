CREATE TABLE "public_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"secret_hash" text NOT NULL,
	"secret_encrypted" text,
	"events_csv" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"http_status" integer,
	"error" text,
	"duration_ms" integer,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_api_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid,
	"user_id" uuid,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer NOT NULL,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_api_keys" ADD CONSTRAINT "public_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_webhook_endpoints" ADD CONSTRAINT "public_webhook_endpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_webhook_events" ADD CONSTRAINT "public_webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_webhook_deliveries" ADD CONSTRAINT "public_webhook_deliveries_endpoint_id_public_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."public_webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_webhook_deliveries" ADD CONSTRAINT "public_webhook_deliveries_event_id_public_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."public_webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_api_usage" ADD CONSTRAINT "public_api_usage_api_key_id_public_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."public_api_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_api_usage" ADD CONSTRAINT "public_api_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_api_keys_user_id_idx" ON "public_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "public_api_keys_key_hash_idx" ON "public_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "public_api_keys_last_used_at_idx" ON "public_api_keys" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "public_webhook_endpoints_user_id_idx" ON "public_webhook_endpoints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "public_webhook_endpoints_enabled_idx" ON "public_webhook_endpoints" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "public_webhook_events_user_id_idx" ON "public_webhook_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "public_webhook_events_created_at_idx" ON "public_webhook_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "public_webhook_events_type_idx" ON "public_webhook_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "public_webhook_deliveries_endpoint_created_idx" ON "public_webhook_deliveries" USING btree ("endpoint_id","created_at");--> statement-breakpoint
CREATE INDEX "public_webhook_deliveries_next_retry_idx" ON "public_webhook_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "public_webhook_deliveries_event_id_idx" ON "public_webhook_deliveries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "public_api_usage_created_at_idx" ON "public_api_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "public_api_usage_api_key_id_idx" ON "public_api_usage" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "public_api_usage_user_id_idx" ON "public_api_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "public_api_usage_path_idx" ON "public_api_usage" USING btree ("path");
