ALTER TABLE "criterion" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "evidence" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "helpRequest" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "milestone" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reflection" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scorecard" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "criterion" CASCADE;--> statement-breakpoint
DROP TABLE "evidence" CASCADE;--> statement-breakpoint
DROP TABLE "helpRequest" CASCADE;--> statement-breakpoint
DROP TABLE "milestone" CASCADE;--> statement-breakpoint
DROP TABLE "reflection" CASCADE;--> statement-breakpoint
DROP TABLE "scorecard" CASCADE;--> statement-breakpoint
DROP TABLE "task" CASCADE;--> statement-breakpoint
ALTER TABLE "enrolment" DROP CONSTRAINT "enrolment_leadCoachId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "phase";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "level";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "targetStrands";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "indicatorCurrent";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "projectType";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "planValidatedAt";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "planValidatedByName";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "charterSignedByName";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "leadCoachId";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "charterSignedAt";--> statement-breakpoint
ALTER TABLE "enrolment" DROP COLUMN "completedAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "calendarToken";