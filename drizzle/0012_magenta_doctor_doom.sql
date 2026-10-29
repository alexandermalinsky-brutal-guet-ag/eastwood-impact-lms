CREATE TABLE "projectIdea" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"suggestedById" text,
	"suggestedByName" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projectIdea" ADD CONSTRAINT "projectIdea_suggestedById_user_id_fk" FOREIGN KEY ("suggestedById") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_idea_created_idx" ON "projectIdea" USING btree ("createdAt");