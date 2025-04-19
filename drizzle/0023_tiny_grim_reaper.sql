CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationHandle" text,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text NOT NULL,
	"hostedInvoiceUrl" text,
	"pdf" text,
	"periodStart" timestamp,
	"periodEnd" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizationBilling" (
	"handle" text PRIMARY KEY NOT NULL,
	"stripeCustomerId" text NOT NULL,
	"stripeSubscriptionId" text NOT NULL,
	"stripePriceId" text NOT NULL,
	"subscriptionItemId" text NOT NULL,
	"currentQuantity" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organizationHandle_organization_handle_fk" FOREIGN KEY ("organizationHandle") REFERENCES "public"."organization"("handle") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationBilling" ADD CONSTRAINT "organizationBilling_handle_organization_handle_fk" FOREIGN KEY ("handle") REFERENCES "public"."organization"("handle") ON DELETE cascade ON UPDATE no action;