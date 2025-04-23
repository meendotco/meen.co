CREATE TABLE "customField" (
	"id" text PRIMARY KEY NOT NULL,
	"jobPostId" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customFieldValue" (
	"id" text PRIMARY KEY NOT NULL,
	"customFieldId" text NOT NULL,
	"candidateId" text NOT NULL,
	"value" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "applied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "theme" text;--> statement-breakpoint
ALTER TABLE "customField" ADD CONSTRAINT "customField_jobPostId_jobPost_id_fk" FOREIGN KEY ("jobPostId") REFERENCES "public"."jobPost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customFieldValue" ADD CONSTRAINT "customFieldValue_customFieldId_customField_id_fk" FOREIGN KEY ("customFieldId") REFERENCES "public"."customField"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customFieldValue" ADD CONSTRAINT "customFieldValue_candidateId_candidate_id_fk" FOREIGN KEY ("candidateId") REFERENCES "public"."candidate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customField_jobPostId_idx" ON "customField" USING btree ("jobPostId");--> statement-breakpoint
CREATE INDEX "customFieldValue_customFieldId_idx" ON "customFieldValue" USING btree ("customFieldId");