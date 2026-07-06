CREATE TABLE "ai_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"query_log_id" uuid,
	"message_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_query_logs" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "ai_query_logs" ADD COLUMN "eval_model" text;--> statement-breakpoint
ALTER TABLE "ai_query_logs" ADD COLUMN "eval_latency_ms" integer;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_query_log_id_ai_query_logs_id_fk" FOREIGN KEY ("query_log_id") REFERENCES "public"."ai_query_logs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_feedback_created_at_idx" ON "ai_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_feedback_user_id_idx" ON "ai_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_feedback_query_log_id_idx" ON "ai_feedback" USING btree ("query_log_id");--> statement-breakpoint
CREATE INDEX "ai_feedback_message_id_idx" ON "ai_feedback" USING btree ("message_id");