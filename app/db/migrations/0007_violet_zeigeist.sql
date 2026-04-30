CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"anon_id" text NOT NULL,
	"name" text NOT NULL,
	"props" jsonb,
	"page_path" text,
	"referrer" text,
	"ua_hash" text,
	"ip_hash" text,
	"day" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"resolution" text
);
--> statement-breakpoint
CREATE TABLE "forum_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_parent_comment_id_forum_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."forum_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_day_idx" ON "analytics_events" USING btree ("day");--> statement-breakpoint
CREATE INDEX "analytics_events_user_id_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "analytics_events_anon_id_idx" ON "analytics_events" USING btree ("anon_id");--> statement-breakpoint
CREATE INDEX "analytics_events_name_idx" ON "analytics_events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "forum_comments_post_id_idx" ON "forum_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "forum_comments_author_user_id_idx" ON "forum_comments" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "forum_comments_created_at_idx" ON "forum_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "forum_posts_author_user_id_idx" ON "forum_posts" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "forum_posts_created_at_idx" ON "forum_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "forum_posts_last_activity_at_idx" ON "forum_posts" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "forum_reports_target_idx" ON "forum_reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "forum_reports_created_at_idx" ON "forum_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "forum_votes_target_idx" ON "forum_votes" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "forum_votes_user_id_idx" ON "forum_votes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "forum_votes_user_target_unique" ON "forum_votes" USING btree ("user_id","target_type","target_id");