ALTER TABLE "jobPost" DROP CONSTRAINT "jobPost_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "jobPost" DROP CONSTRAINT "jobPost_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "jobPost" DROP COLUMN "ownerId";--> statement-breakpoint
ALTER TABLE "jobPost" DROP COLUMN "userId";