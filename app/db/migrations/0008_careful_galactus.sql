ALTER TYPE "public"."web3_intent_type" ADD VALUE 'claim' BEFORE 'vote';--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN "session_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events" USING btree ("session_id");