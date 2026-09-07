CREATE TABLE "goal" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"kind" text DEFAULT 'deliverable' NOT NULL,
	"statement" text NOT NULL,
	"measure" text DEFAULT '' NOT NULL,
	"dueBy" text DEFAULT '' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"achieved" boolean DEFAULT false NOT NULL,
	"recalibratedAt" timestamp,
	"recalibrationNote" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorecard" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"kind" text NOT NULL,
	"authorId" text,
	"ratings" text DEFAULT '{}' NOT NULL,
	"notes" text DEFAULT '{}' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"periodLabel" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "stage" text DEFAULT 'ideation' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "targetStrands" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "proposalIdea" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "proposalInternalImpact" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "proposalExternalImpact" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "proposalFeasibility" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "projectType" text DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "proposalSubmittedAt" timestamp;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "approvedAt" timestamp;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "approvedBy" text;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "leadCoachId" text;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "charterSignedAt" timestamp;--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard" ADD CONSTRAINT "scorecard_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorecard" ADD CONSTRAINT "scorecard_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_enrolment_idx" ON "goal" USING btree ("enrolmentId");--> statement-breakpoint
CREATE INDEX "scorecard_enrolment_idx" ON "scorecard" USING btree ("enrolmentId");--> statement-breakpoint
CREATE INDEX "scorecard_kind_idx" ON "scorecard" USING btree ("kind");--> statement-breakpoint
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_approvedBy_user_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_leadCoachId_user_id_fk" FOREIGN KEY ("leadCoachId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;