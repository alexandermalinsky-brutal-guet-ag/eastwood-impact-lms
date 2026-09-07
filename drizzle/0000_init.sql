CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "criterion" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"label" text NOT NULL,
	"met" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrolment" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"projectSlug" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "reflection" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"cycle" integer DEFAULT 1 NOT NULL,
	"plan" text DEFAULT '' NOT NULL,
	"act" text DEFAULT '' NOT NULL,
	"reflect" text DEFAULT '' NOT NULL,
	"furtherQuestion" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"enrolmentId" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'backlog' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"passwordHash" text,
	"role" text DEFAULT 'student' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criterion" ADD CONSTRAINT "criterion_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolment" ADD CONSTRAINT "enrolment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reflection" ADD CONSTRAINT "reflection_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_enrolmentId_enrolment_id_fk" FOREIGN KEY ("enrolmentId") REFERENCES "public"."enrolment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "criterion_enrolment_idx" ON "criterion" USING btree ("enrolmentId");--> statement-breakpoint
CREATE UNIQUE INDEX "enrolment_user_project_idx" ON "enrolment" USING btree ("userId","projectSlug");--> statement-breakpoint
CREATE INDEX "enrolment_project_idx" ON "enrolment" USING btree ("projectSlug");--> statement-breakpoint
CREATE INDEX "reflection_enrolment_idx" ON "reflection" USING btree ("enrolmentId");--> statement-breakpoint
CREATE INDEX "task_enrolment_idx" ON "task" USING btree ("enrolmentId");