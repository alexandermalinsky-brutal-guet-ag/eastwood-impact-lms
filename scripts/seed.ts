/**
 * Creates the one account needed to get in the first time.
 *
 *   npm run db:seed
 *
 * That is all it does. Everyone else — students, coaches, other admins — is
 * added from the Accounts page, by a person, with a password handed over
 * directly. This used to create a coach account for all 17 point people named
 * in the planning workbook plus an impact@ admin, all sharing one password.
 * That was a roster, not a set of accounts: most of them never signed in, and
 * the list came back every time the script ran.
 *
 * Being named against a project in the workbook is data. Having an account is
 * a decision somebody makes.
 */
import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";

import { db, isDatabaseConfigured } from "../src/db";
import { users } from "../src/db/schema";

if (!isDatabaseConfigured()) {
  console.error("Set DATABASE_URL before seeding.");
  process.exit(1);
}

const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "eastwood.global";

async function main() {
  // A bootstrap account only makes sense on an empty platform. If anyone can
  // already sign in, they can add the next person themselves.
  const [someone] = await db().select({ id: users.id }).from(users).limit(1);
  if (someone) {
    console.log("Accounts already exist — nothing to bootstrap.");
    console.log("Add people from the Accounts page, or with: npm run user -- --email …");
    return;
  }

  const email = (process.env.SEED_ADMIN_EMAIL ?? `admin@${DOMAIN}`).toLowerCase();
  const password = process.env.SEED_PASSWORD ?? randomBytes(12).toString("base64url");

  await db().insert(users).values({
    email,
    name: process.env.SEED_ADMIN_NAME ?? "IMPACT Admin",
    role: "admin",
    passwordHash: await hash(password, 10),
  });

  console.log(`\nCreated the first admin: ${email}`);
  if (!process.env.SEED_PASSWORD) {
    console.log(`Password: ${password}`);
    console.log("Shown once. Change it, or set SEED_PASSWORD to choose your own.");
  }
  console.log("\nSign in, then add everyone else from the Accounts page.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
