CREATE TABLE "ton_indexed_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"network" text NOT NULL,
	"address" text NOT NULL,
	"tx_hash" text NOT NULL,
	"kind" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ton_indexed_transactions_network_address_hash_unique" ON "ton_indexed_transactions" ("network","address","tx_hash");
--> statement-breakpoint
CREATE INDEX "ton_indexed_transactions_network_address_time_idx" ON "ton_indexed_transactions" ("network","address","occurred_at");

