/**
 * Creates (or updates) a single account.
 *
 *   npm run user -- --email you@school.ch --name "Your Name" --role admin
 *
 * Generates a strong password unless --password is given, and prints it once.
 * Re-running for an existing email updates the role, and resets the password
 * only when --reset-password is passed.
 *
 * Add --prod to run against .env.prod.local instead of .env.local.
 */
import { randomBytes } from "node:crypto";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db, isDatabaseConfigured } from "../src/db";
import { users, type Role } from "../src/db/schema";

const ROLES: Role[] = ["student", "coach", "admin"];

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/**
 * Rejects a --password that is obviously a placeholder copied out of an
 * instruction, or too weak to be worth storing. Without this the tool will
 * cheerfully hash "your-choice" and the account is then locked behind a
 * password nobody meant to set.
 */
function assertPasswordUsable(password: string): void {
  const placeholders =
    /^(your-choice|your-password|password|passwd|changeme|change-me|paste-.*|pick-a-real-password|.*-here|placeholder|secret|admin|test|123456)$/i;

  if (placeholders.test(password)) {
    throw new Error(
      `"${password}" looks like a placeholder, not a password you chose.\n` +
        "Either pass a real one, or omit --password and a strong one will be generated for you.",
    );
  }

  if (password.length < 10) {
    throw new Error(
      `Password is only ${password.length} characters. Use at least 10, ` +
        "or omit --password to have a strong one generated.",
    );
  }
}

/** Readable but high-entropy: 4 groups of 5 from an unambiguous alphabet. */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join("")).join("-");
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("No DATABASE_URL. Pass --prod to read .env.prod.local, or set it inline.");
    process.exit(1);
  }

  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "admin") as Role;
  const supplied = arg("password");
  if (supplied) assertPasswordUsable(supplied);
  const password = supplied ?? generatePassword();
  const generated = !supplied;

  if (!email || !email.includes("@")) {
    console.error('Pass an email: --email you@school.ch [--name "Your Name"] [--role admin]');
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`--role must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  const [existing] = await db()
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordHash = await hash(password, 10);

  if (existing) {
    const resetting = flag("reset-password");
    await db()
      .update(users)
      .set({
        role,
        ...(name ? { name } : {}),
        ...(resetting ? { passwordHash } : {}),
      })
      .where(eq(users.id, existing.id));

    console.log(`\nUpdated ${email} — role ${existing.role} → ${role}.`);
    if (resetting) {
      console.log(`Password reset to: ${password}`);
    } else {
      console.log("Password left unchanged. Pass --reset-password to change it.");
    }
  } else {
    await db().insert(users).values({ email, name: name ?? null, role, passwordHash });
    console.log(`\nCreated ${role} account.`);
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
  }

  if (generated) {
    console.log("\nStore this in a password manager — it is not recoverable, only resettable.");
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (/DATABASE_URL|ENOTFOUND|ECONNREFUSED|password authentication|does not exist/i.test(message)) {
      console.error(`\nCould not reach the database.\n\n${message}\n`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
