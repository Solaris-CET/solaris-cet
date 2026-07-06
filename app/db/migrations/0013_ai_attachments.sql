CREATE TABLE "ai_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"data_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_attachments" ADD CONSTRAINT "ai_attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ai_attachments_user_id_idx" ON "ai_attachments" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "ai_attachments_created_at_idx" ON "ai_attachments" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE "ai_message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_message_attachments" ADD CONSTRAINT "ai_message_attachments_message_id_ai_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ai_message_attachments" ADD CONSTRAINT "ai_message_attachments_attachment_id_ai_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."ai_attachments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_message_attachments_unique" ON "ai_message_attachments" USING btree ("message_id","attachment_id");
--> statement-breakpoint
CREATE INDEX "ai_message_attachments_message_id_idx" ON "ai_message_attachments" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "ai_message_attachments_attachment_id_idx" ON "ai_message_attachments" USING btree ("attachment_id");
