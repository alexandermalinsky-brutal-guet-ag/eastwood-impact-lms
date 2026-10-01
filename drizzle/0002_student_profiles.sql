ALTER TABLE "user" ADD COLUMN "grade" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phase" text DEFAULT 'exploration' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "academicYear" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active" boolean DEFAULT true NOT NULL;