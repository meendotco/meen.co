ALTER TABLE "jobPost" ADD COLUMN "handle" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "jobPost_handle_org_unique" ON "jobPost" USING btree ("handle","ownerOrganizationHandle");