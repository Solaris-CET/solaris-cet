CREATE TYPE "public"."cetuia_token_status" AS ENUM('available', 'reserved', 'sold');--> statement-breakpoint
CREATE TABLE "cetuia_tokens" (
	"id" integer PRIMARY KEY NOT NULL,
	"status" "public"."cetuia_token_status" DEFAULT 'available' NOT NULL,
	"owner_wallet_address" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cetuia_tokens_status_idx" ON "cetuia_tokens" ("status");--> statement-breakpoint
CREATE INDEX "cetuia_tokens_owner_idx" ON "cetuia_tokens" ("owner_wallet_address");--> statement-breakpoint
INSERT INTO "cetuia_tokens" ("id","status")
SELECT gs, 'available'::"public"."cetuia_token_status"
FROM generate_series(1,9000) gs
ON CONFLICT ("id") DO NOTHING;

