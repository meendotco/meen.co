CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "organizationId" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;