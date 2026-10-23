ALTER TABLE "user" ADD COLUMN "calendarToken" text;--> statement-breakpoint
-- Existing accounts need a token too, or their feed URL cannot be built.
UPDATE "user" SET "calendarToken" = gen_random_uuid()::text WHERE "calendarToken" IS NULL;
