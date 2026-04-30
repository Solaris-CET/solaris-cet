ALTER TABLE "admin_accounts" ADD COLUMN "mfa_secret_encrypted" text;
--> statement-breakpoint
ALTER TABLE "admin_accounts" ADD COLUMN "mfa_enabled_at" timestamp with time zone;
