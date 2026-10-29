ALTER TABLE "attendance" ALTER COLUMN "markedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "markedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "attendanceSession" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendanceSession" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "proposalSubmittedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "approvedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "returnedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "joinedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "joinedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "enrolment" ALTER COLUMN "withdrawnAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projectIdea" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projectIdea" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now();