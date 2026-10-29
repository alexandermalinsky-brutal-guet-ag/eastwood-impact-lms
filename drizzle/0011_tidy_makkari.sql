ALTER TABLE "enrolment" ADD COLUMN "coachId" text;--> statement-breakpoint
ALTER TABLE "enrolment" ADD COLUMN "coachName" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_coachId_user_id_fk" FOREIGN KEY ("coachId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;