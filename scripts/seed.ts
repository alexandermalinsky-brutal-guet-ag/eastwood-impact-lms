/**
 * Creates the first accounts so someone can sign in.
 *
 *   DATABASE_URL=... npm run db:seed
 *
 * Passwords are read from SEED_PASSWORD (or generated and printed once).
 * Change them on first sign-in — these are bootstrap accounts, not real ones.
 */
import { randomBytes } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

import { users, type Role } from "../src/db/schema";
import people from "../src/data/people.json";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("Set DATABASE_URL before seeding.");
  process.exit(1);
}

const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "eastwoodmontreux.ch";
const db = drizzle(neon(url), { schema: { users } });

function emailFor(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
  return `${slug}@${domain}`;
}

async function main() {
  const password = process.env.SEED_PASSWORD ?? randomBytes(9).toString("base64url");
  const passwordHash = await hash(password, 10);

  // Everyone named as a point person in the workbook becomes a coach account;
  // the first one is promoted to admin so there is someone who can see /staff.
  const seeds: { name: string; email: string; role: Role }[] = (
    people as { name: string }[]
  ).map((person, index) => ({
    name: person.name,
    email: emailFor(person.name),
    role: index === 0 ? "admin" : "coach",
  }));

  seeds.push({
    name: "IMPACT Admin",
    email: `impact@${domain}`,
    role: "admin",
  });

  let created = 0;
  for (const seed of seeds) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seed.email))
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(users).values({ ...seed, passwordHash });
    created += 1;
  }

  console.log(`Created ${created} account(s), skipped ${seeds.length - created}.`);
  if (!process.env.SEED_PASSWORD) {
    console.log(`\nShared bootstrap password: ${password}`);
    console.log("Set SEED_PASSWORD to choose your own. Change these after first sign-in.\n");
  }
  console.log(`Admin sign-in: impact@${domain}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
