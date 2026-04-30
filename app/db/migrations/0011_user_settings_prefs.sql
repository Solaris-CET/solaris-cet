ALTER TABLE "user_settings" ADD COLUMN "locale" text DEFAULT 'ro' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "theme" text DEFAULT 'dark' NOT NULL;
