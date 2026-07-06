CREATE TABLE "consent_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_key" text NOT NULL,
	"user_id" uuid,
	"essential" boolean DEFAULT true NOT NULL,
	"analytics" boolean NOT NULL,
	"marketing" boolean NOT NULL,
	"policy_version" text NOT NULL,
	"policy_hash" text,
	"source" text DEFAULT 'unknown' NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_proofs" ADD CONSTRAINT "consent_proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consent_proofs_consent_key_idx" ON "consent_proofs" USING btree ("consent_key");--> statement-breakpoint
CREATE INDEX "consent_proofs_user_id_idx" ON "consent_proofs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consent_proofs_created_at_idx" ON "consent_proofs" USING btree ("created_at");