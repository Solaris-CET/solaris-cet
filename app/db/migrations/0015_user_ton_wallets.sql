CREATE TABLE "user_ton_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"label" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_ton_wallets" ADD CONSTRAINT "user_ton_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "user_ton_wallets_address_unique" ON "user_ton_wallets" USING btree ("address");
--> statement-breakpoint
CREATE INDEX "user_ton_wallets_user_id_idx" ON "user_ton_wallets" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "user_ton_wallets_user_primary_idx" ON "user_ton_wallets" USING btree ("user_id","is_primary");
