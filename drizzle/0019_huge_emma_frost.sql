ALTER TABLE "organization" RENAME COLUMN "name" TO "handle";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "organizationId" TO "organizationHandle";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_organizationHandle_organization_handle_fk" FOREIGN KEY ("organizationHandle") REFERENCES "public"."organization"("handle") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "id";