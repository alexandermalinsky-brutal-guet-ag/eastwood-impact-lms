/**
 * Creates student accounts in bulk from a CSV roster.
 *
 *   npm run roster -- --file roster.csv              # dry run: shows what it would do
 *   npm run roster -- --file roster.csv --commit     # actually creates the accounts
 *   npm run roster:prod -- --file roster.csv --commit
 *
 * The CSV needs a header row. Recognised columns (case-insensitive, any order):
 *
 *   email      required
 *   name       optional — falls back to the part before the @
 *   grade      optional — "9".."13", informational only
 *   phase      optional — exploration | execution | legacy (default exploration)
 *   role       optional — student | coach | admin (default student)
 *
 * Passwords are generated, never taken from the file, and written to a
 * gitignored credentials CSV for you to distribute individually. Re-running is
 * safe: an existing email is updated, never duplicated, and its password is
 * left alone unless you pass --reset-existing.
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { hash } from "bcryptjs";
import { inArray } from "drizzle-orm";

import { db, isDatabaseConfigured } from "../src/db";
import { users, type Role } from "../src/db/schema";

type Phase = "exploration" | "execution" | "legacy";

const ROLES: Role[] = ["student", "coach", "admin"];
const PHASES: Phase[] = ["exploration", "execution", "legacy"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

/** Minimal CSV reader: handles quoted fields and embedded commas. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Readable but high-entropy, from an alphabet with no look-alike characters. */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const chars = Array.from(randomBytes(20), (b) => alphabet[b % alphabet.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join("")).join("-");
}

type Row = { email: string; name: string; grade: string | null; phase: Phase; role: Role; line: number };

function readRoster(file: string): { rows: Row[]; problems: string[] } {
  const table = parseCsv(readFileSync(file, "utf8"));
  if (table.length < 2) throw new Error("The CSV needs a header row and at least one student.");

  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (n: string) => header.indexOf(n);
  if (col("email") === -1) {
    throw new Error(`No "email" column. Found: ${header.join(", ")}`);
  }

  const rows: Row[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (n: string) => (col(n) === -1 ? "" : (cells[col(n)] ?? "").trim());

    const email = get("email").toLowerCase();
    if (!email.includes("@")) { problems.push(`line ${line}: "${email}" is not an email`); return; }
    if (seen.has(email)) { problems.push(`line ${line}: ${email} appears twice in the file`); return; }
    seen.add(email);

    const rawPhase = get("phase").toLowerCase();
    if (rawPhase && !PHASES.includes(rawPhase as Phase)) {
      problems.push(`line ${line}: phase "${rawPhase}" is not one of ${PHASES.join(", ")}`);
      return;
    }
    const rawRole = get("role").toLowerCase();
    if (rawRole && !ROLES.includes(rawRole as Role)) {
      problems.push(`line ${line}: role "${rawRole}" is not one of ${ROLES.join(", ")}`);
      return;
    }

    rows.push({
      email,
      name: get("name") || email.split("@")[0],
      grade: get("grade") || null,
      phase: (rawPhase || "exploration") as Phase,
      role: (rawRole || "student") as Role,
      line,
    });
  });

  return { rows, problems };
}

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("No DATABASE_URL. Use npm run roster:prod to read .env.prod.local.");
    process.exit(1);
  }

  const file = arg("file");
  if (!file) {
    console.error('Pass a CSV: npm run roster -- --file roster.csv [--commit]');
    process.exit(1);
  }

  const academicYear = arg("year") ?? null;
  const { rows, problems } = readRoster(file);

  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in ${file}:\n`);
    problems.forEach((p) => console.error("  " + p));
    console.error("\nNothing was written. Fix the file and run again.\n");
    process.exit(1);
  }

  // One query rather than one per row, so a 300-student roster is fast.
  const existing = await db()
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.email, rows.map((r) => r.email)));
  const known = new Set(existing.map((e) => e.email));

  const toCreate = rows.filter((r) => !known.has(r.email));
  const toUpdate = rows.filter((r) => known.has(r.email));

  console.log(`\n${file}`);
  console.log(`  ${rows.length} row(s): ${toCreate.length} new, ${toUpdate.length} already on the platform`);
  if (academicYear) console.log(`  academic year: ${academicYear}`);
  const byPhase = PHASES.map((p) => `${rows.filter((r) => r.phase === p).length} ${p}`).join(" · ");
  console.log(`  ${byPhase}`);

  if (!flag("commit")) {
    console.log("\nDry run — nothing written. Add --commit to create these accounts.\n");
    rows.slice(0, 5).forEach((r) => console.log(`    ${r.email}  ${r.role}  ${r.phase}${r.grade ? `  grade ${r.grade}` : ""}`));
    if (rows.length > 5) console.log(`    … and ${rows.length - 5} more`);
    console.log("");
    return;
  }

  const credentials: string[] = ["email,name,password"];

  for (const row of toCreate) {
    const password = generatePassword();
    await db().insert(users).values({
      email: row.email,
      name: row.name,
      role: row.role,
      grade: row.grade,
      phase: row.phase,
      academicYear,
      passwordHash: await hash(password, 10),
    });
    credentials.push(`${row.email},"${row.name}",${password}`);
  }

  // Existing people keep their password unless you explicitly ask otherwise —
  // re-importing a roster should never lock the school out mid-term.
  const resetExisting = flag("reset-existing");
  for (const row of toUpdate) {
    const patch: Record<string, unknown> = {
      name: row.name, role: row.role, grade: row.grade, phase: row.phase, active: true,
    };
    if (academicYear) patch.academicYear = academicYear;
    if (resetExisting) {
      const password = generatePassword();
      patch.passwordHash = await hash(password, 10);
      credentials.push(`${row.email},"${row.name}",${password}`);
    }
    await db().update(users).set(patch).where(inArray(users.email, [row.email]));
  }

  console.log(`\nCreated ${toCreate.length}, updated ${toUpdate.length}.`);

  if (credentials.length > 1) {
    const out = `roster-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    writeFileSync(out, credentials.join("\n") + "\n");
    console.log(`\nPasswords written to ${out} (${credentials.length - 1} accounts).`);
    console.log("That file is gitignored. Hand each password out individually, then delete it.");
  } else {
    console.log("\nNo new passwords — existing accounts kept theirs.");
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
      console.error(`\n${message}\n`);
    }
    process.exit(1);
  });
