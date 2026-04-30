CREATE TYPE "public"."badge_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."nft_badge_claim_status" AS ENUM('requested', 'minted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."quest_kind" AS ENUM('daily', 'seasonal', 'social');--> statement-breakpoint
CREATE TYPE "public"."user_quest_status" AS ENUM('in_progress', 'completed', 'claimed', 'pending_review', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."weekly_reward_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "affiliate_clicks_daily" (
	"affiliate_link_id" uuid NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"rarity" "badge_rarity" DEFAULT 'common' NOT NULL,
	"points_bonus" integer DEFAULT 0 NOT NULL,
	"ton_metadata_uri" text,
	"active" boolean DEFAULT true NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "nft_badge_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"status" "nft_badge_claim_status" DEFAULT 'requested' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"minted_at" timestamp with time zone,
	"tx_hash" text,
	"nft_address" text,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" "quest_kind" NOT NULL,
	"action_key" text NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"points_reward" integer DEFAULT 0 NOT NULL,
	"requires_proof" boolean DEFAULT false NOT NULL,
	"season_key" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" text NOT NULL,
	"cost_points" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"equipped" boolean DEFAULT false NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_invite_uses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invite_id" uuid NOT NULL,
	"used_by_user_id" uuid,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_quest_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"quest_id" uuid NOT NULL,
	"day" text DEFAULT '' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "user_quest_status" DEFAULT 'in_progress' NOT NULL,
	"proof_url" text,
	"completed_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_active_day" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_leaderboard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leaderboard_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"points_earned" integer NOT NULL,
	"total_points" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_leaderboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" text NOT NULL,
	"week_end" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_leaderboards_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
CREATE TABLE "weekly_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leaderboard_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"cet_amount" numeric(36, 18) NOT NULL,
	"status" "weekly_reward_status" DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"sent_at" timestamp with time zone,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wheel_spins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" text NOT NULL,
	"reward_points" integer NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_clicks_daily" ADD CONSTRAINT "affiliate_clicks_daily_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nft_badge_claims" ADD CONSTRAINT "nft_badge_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nft_badge_claims" ADD CONSTRAINT "nft_badge_claims_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_item_id_shop_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invite_uses" ADD CONSTRAINT "user_invite_uses_invite_id_user_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."user_invites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invite_uses" ADD CONSTRAINT "user_invite_uses_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_leaderboard_entries" ADD CONSTRAINT "weekly_leaderboard_entries_leaderboard_id_weekly_leaderboards_id_fk" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."weekly_leaderboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_leaderboard_entries" ADD CONSTRAINT "weekly_leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_rewards" ADD CONSTRAINT "weekly_rewards_leaderboard_id_weekly_leaderboards_id_fk" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."weekly_leaderboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_rewards" ADD CONSTRAINT "weekly_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "affiliate_clicks_daily_link_day_unique" ON "affiliate_clicks_daily" USING btree ("affiliate_link_id","day");--> statement-breakpoint
CREATE INDEX "affiliate_clicks_daily_day_idx" ON "affiliate_clicks_daily" USING btree ("day");--> statement-breakpoint
CREATE INDEX "affiliate_links_user_id_idx" ON "affiliate_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "affiliate_links_active_idx" ON "affiliate_links" USING btree ("active");--> statement-breakpoint
CREATE INDEX "badges_rarity_idx" ON "badges" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "badges_active_idx" ON "badges" USING btree ("active");--> statement-breakpoint
CREATE INDEX "nft_badge_claims_user_id_idx" ON "nft_badge_claims" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nft_badge_claims_status_idx" ON "nft_badge_claims" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "nft_badge_claims_user_badge_unique" ON "nft_badge_claims" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX "quests_kind_active_idx" ON "quests" USING btree ("kind","active");--> statement-breakpoint
CREATE INDEX "quests_action_key_idx" ON "quests" USING btree ("action_key");--> statement-breakpoint
CREATE INDEX "quests_starts_at_idx" ON "quests" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "shop_items_active_idx" ON "shop_items" USING btree ("active");--> statement-breakpoint
CREATE INDEX "shop_items_kind_idx" ON "shop_items" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "user_badges_user_id_idx" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges" USING btree ("badge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_badges_user_badge_unique" ON "user_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX "user_inventory_user_id_idx" ON "user_inventory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_inventory_item_id_idx" ON "user_inventory" USING btree ("item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_inventory_user_item_unique" ON "user_inventory" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE INDEX "user_invite_uses_invite_id_idx" ON "user_invite_uses" USING btree ("invite_id");--> statement-breakpoint
CREATE INDEX "user_invite_uses_used_by_user_id_idx" ON "user_invite_uses" USING btree ("used_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_invite_uses_invite_user_unique" ON "user_invite_uses" USING btree ("invite_id","used_by_user_id");--> statement-breakpoint
CREATE INDEX "user_invites_created_by_idx" ON "user_invites" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "user_invites_expires_at_idx" ON "user_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_quest_progress_user_id_idx" ON "user_quest_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_quest_progress_quest_id_idx" ON "user_quest_progress" USING btree ("quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_quest_progress_user_quest_day_unique" ON "user_quest_progress" USING btree ("user_id","quest_id","day");--> statement-breakpoint
CREATE INDEX "user_quest_progress_status_idx" ON "user_quest_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_streaks_current_streak_idx" ON "user_streaks" USING btree ("current_streak");--> statement-breakpoint
CREATE INDEX "weekly_leaderboard_entries_leaderboard_id_idx" ON "weekly_leaderboard_entries" USING btree ("leaderboard_id");--> statement-breakpoint
CREATE INDEX "weekly_leaderboard_entries_user_id_idx" ON "weekly_leaderboard_entries" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_leaderboard_entries_leaderboard_user_unique" ON "weekly_leaderboard_entries" USING btree ("leaderboard_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_leaderboard_entries_leaderboard_rank_unique" ON "weekly_leaderboard_entries" USING btree ("leaderboard_id","rank");--> statement-breakpoint
CREATE INDEX "weekly_leaderboards_generated_at_idx" ON "weekly_leaderboards" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "weekly_rewards_leaderboard_id_idx" ON "weekly_rewards" USING btree ("leaderboard_id");--> statement-breakpoint
CREATE INDEX "weekly_rewards_user_id_idx" ON "weekly_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_rewards_status_idx" ON "weekly_rewards" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_rewards_leaderboard_user_unique" ON "weekly_rewards" USING btree ("leaderboard_id","user_id");--> statement-breakpoint
CREATE INDEX "wheel_spins_user_id_idx" ON "wheel_spins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wheel_spins_user_day_unique" ON "wheel_spins" USING btree ("user_id","day");