/** Applies the SQL migrations in drizzle/ to DATABASE_URL. */
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";

import { db, isDatabaseConfigured } from "../src/db";

if (!isDatabaseConfigured()) {
  console.error("Set DATABASE_URL before migrating.");
  process.exit(1);
}

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
const overHttp = /\.neon\.tech|\.vercel-storage\.com|neon\.build/.test(url);

async function main() {
  const client = db();
  const options = { migrationsFolder: "drizzle" };

  // The migrator is driver-specific even though the query builder is not.
  if (overHttp) {
    await migrateNeon(client, options);
  } else {
    await migratePg(client as never, options);
  }
  console.log("Migrations applied.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    // A bad connection string is the common case here and does not need a
    // stack trace — just say what is wrong with it.
    const message = error instanceof Error ? error.message : String(error);
    if (/DATABASE_URL|ENOTFOUND|ECONNREFUSED|password authentication/i.test(message)) {
      console.error(`\nCould not connect to the database.\n\n${message}\n`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
