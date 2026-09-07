/** Dev helper: create a throwaway student account for testing sign-in flows. */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const email = process.argv[2] ?? "student@eastwoodmontreux.ch";
  const password = process.argv[3] ?? "impact2026";

  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`${email} already exists.`);
    return;
  }

  await db().insert(users).values({
    name: "Test Student",
    email,
    role: "student",
    passwordHash: await hash(password, 10),
  });
  console.log(`Created student ${email} / ${password}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
