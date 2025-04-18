CREATE TABLE "accessRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"companyName" text,
	"message" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accessRequest" ADD CONSTRAINT "accessRequest_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;