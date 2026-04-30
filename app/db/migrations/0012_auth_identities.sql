CREATE TABLE "telegram_login_identities" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"telegram_user_id" text NOT NULL,
	"username" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_login_identities" ADD CONSTRAINT "telegram_login_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_login_identities_telegram_user_id_unique" ON "telegram_login_identities" USING btree ("telegram_user_id");
--> statement-breakpoint
CREATE INDEX "telegram_login_identities_telegram_user_id_idx" ON "telegram_login_identities" USING btree ("telegram_user_id");
--> statement-breakpoint

CREATE TABLE "oauth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"username" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_identities" ADD CONSTRAINT "oauth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_identities_provider_user_unique" ON "oauth_identities" USING btree ("provider","provider_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_identities_provider_userId_unique" ON "oauth_identities" USING btree ("provider","user_id");
--> statement-breakpoint
CREATE INDEX "oauth_identities_user_id_idx" ON "oauth_identities" USING btree ("user_id");
--> statement-breakpoint

CREATE TABLE "oauth_states" (
	"state" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"user_id" uuid,
	"code_verifier" text NOT NULL,
	"return_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "oauth_states_expires_at_idx" ON "oauth_states" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "oauth_states_user_id_idx" ON "oauth_states" USING btree ("user_id");
