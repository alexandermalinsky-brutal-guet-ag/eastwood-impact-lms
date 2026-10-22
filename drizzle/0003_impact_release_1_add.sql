CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"level" integer NOT NULL,
	"milestoneId" text,
	"note" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedAt" timestamp,
	"reviewedByName" text DEFAULT '' NOT NULL,
	"reviewComment" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "helpRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"question" text NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"answeredByName" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"answeredAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "milestone" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"title" text NOT NULL,
	"dueDate" text DEFAULT '' NOT NULL,
	"level" integer,
	"done" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "phase" text DEFAULT 'create' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "problem" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "whoAffected" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "whatChanges" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "deliverable" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "skills" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "needs" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "risk" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "indicatorName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "indicatorBaseline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "indicatorTarget" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "indicatorCurrent" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "fromCatalogue" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "ownTitle" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "approvedByName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "planValidatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "planValidatedByName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "charterSignedByName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "returnedComment" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "returnedAt" timestamp;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_milestoneId_milestone_id_fk" FOREIGN KEY ("milestoneId") REFERENCES "public"."milestone"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "helpRequest" ADD CONSTRAINT "helpRequest_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "evidence_enrolment_idx" ON "evidence" USING btree ("enrolmentId");--> statement-breakpoint
CREATE INDEX "evidence_status_idx" ON "evidence" USING btree ("status");--> statement-breakpoint
CREATE INDEX "help_enrolment_idx" ON "helpRequest" USING btree ("enrolmentId");--> statement-breakpoint
CREATE INDEX "milestone_enrolment_idx" ON "milestone" USING btree ("enrolmentId");--> statement-breakpoint
-- Carry existing projects onto the new phase names and the level map.
UPDATE "enrolment" SET "phase" = CASE "stage"
  WHEN 'ideation'     THEN 'create'
  WHEN 'commitment'   THEN 'plan'
  WHEN 'execution'    THEN 'execute'
  WHEN 'presentation' THEN 'report'
  ELSE 'create' END;
--> statement-breakpoint
UPDATE "enrolment" SET "level" = CASE "phase"
  WHEN 'create'  THEN 1
  WHEN 'plan'    THEN 3
  WHEN 'execute' THEN 4
  WHEN 'report'  THEN 7
  ELSE 1 END;
--> statement-breakpoint
-- The old free-text proposal maps onto the problem statement; the rest of the
-- Impact Proposal has no equivalent and is left for the student to fill.
UPDATE "enrolment" SET "problem" = "proposalIdea" WHERE "proposalIdea" <> '';
--> statement-breakpoint
UPDATE "enrolment" SET "whatChanges" = "proposalExternalImpact" WHERE "proposalExternalImpact" <> '';
--> statement-breakpoint
UPDATE "enrolment" SET "risk" = "proposalFeasibility" WHERE "proposalFeasibility" <> '';
--> statement-breakpoint
-- Approvals recorded a date but no name (brief, section 8).
UPDATE "enrolment" e SET "approvedByName" = COALESCE(u."name", u."email", '')
  FROM "user" u WHERE u."id" = e."approvedBy" AND e."approvedBy" IS NOT NULL;
