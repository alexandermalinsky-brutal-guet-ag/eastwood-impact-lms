CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"userId" text NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"markedByName" text DEFAULT '' NOT NULL,
	"markedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendanceSession" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"createdByName" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_sessionId_attendanceSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."attendanceSession"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_session_user_idx" ON "attendance" USING btree ("sessionId","userId");--> statement-breakpoint
CREATE INDEX "attendance_user_idx" ON "attendance" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "attendance_session_date_idx" ON "attendanceSession" USING btree ("date");