CREATE TABLE "messageChunk" (
	"id" text PRIMARY KEY NOT NULL,
	"chatMessageId" text NOT NULL,
	"chunk" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messageChunk" ADD CONSTRAINT "messageChunk_chatMessageId_chatMessage_id_fk" FOREIGN KEY ("chatMessageId") REFERENCES "public"."chatMessage"("id") ON DELETE cascade ON UPDATE no action;