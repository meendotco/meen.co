ALTER TABLE "jobPost" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "jobPost" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "jobPost" ADD COLUMN "view" text DEFAULT 'table' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobPost" ADD COLUMN "isDeleted" boolean DEFAULT false NOT NULL;