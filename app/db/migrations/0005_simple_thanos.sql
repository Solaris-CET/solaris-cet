CREATE TYPE "public"."web3_intent_status" AS ENUM('created', 'pending', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."web3_intent_type" AS ENUM('stake', 'unstake', 'vote', 'bridge', 'onramp');--> statement-breakpoint
CREATE TABLE "web3_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "web3_intent_type" NOT NULL,
	"status" "web3_intent_status" DEFAULT 'created' NOT NULL,
	"tx_hash" text,
	"provider_ref" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "web3_intents" ADD CONSTRAINT "web3_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "web3_intents_user_id_idx" ON "web3_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "web3_intents_created_at_idx" ON "web3_intents" USING btree ("created_at");