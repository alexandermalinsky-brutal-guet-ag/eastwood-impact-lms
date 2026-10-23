ALTER TABLE "enrolment" ADD COLUMN "withdrawnAt" timestamp;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "withdrawnReason" text DEFAULT '' NOT NULL;