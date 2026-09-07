import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * Two drivers, chosen from the connection string:
 *
 * - Neon / Vercel Postgres over HTTP, which is what production runs on. No TCP
 *   handshake and no connection pool to exhaust from serverless functions.
 * - node-postgres for anything else, so `postgres://localhost/impact_lms` works
 *   on a laptop without a cloud database.
 *
 * Resolution is lazy so `next build` succeeds before a Postgres store has been
 * attached to the Vercel project. Anything touching `db()` must therefore run
 * at request time, never during prerender.
 */

type Database = ReturnType<typeof drizzleNeon<typeof schema>>;

let cached: Database | null = null;

function connectionString(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

/**
 * Catches a DATABASE_URL that is obviously not a connection string — most often
 * an unsubstituted placeholder copied out of a README. Without this, pg takes
 * the value at face value and fails much later with an opaque DNS error.
 */
function assertUsable(url: string): void {
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      `DATABASE_URL is not a Postgres connection string (got "${url.slice(0, 40)}").\n` +
        "It should look like: postgresql://user:password@host/dbname?sslmode=require\n" +
        "Copy it from Vercel → Storage → your database → the .env.local tab.",
    );
  }

  if (/paste|placeholder|your-|<|>|example\.com/i.test(url)) {
    throw new Error(
      "DATABASE_URL still contains placeholder text — substitute the real connection string.",
    );
  }
}

function isHttpCapable(url: string): boolean {
  return /\.neon\.tech|\.vercel-storage\.com|neon\.build/.test(url);
}

function create(url: string): Database {
  assertUsable(url);

  if (isHttpCapable(url)) {
    return drizzleNeon(neon(url), { schema });
  }

  // The two drivers expose the same query builder; drizzle types them
  // separately because their underlying clients differ.
  return drizzlePg(new Pool({ connectionString: url }), {
    schema,
  }) as unknown as Database;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(connectionString());
}

export function db(): Database {
  const url = connectionString();
  if (!url) {
    throw new Error(
      "No DATABASE_URL. Attach a Postgres store to this Vercel project (Storage → Create Database), then redeploy.",
    );
  }
  cached ??= create(url);
  return cached;
}

export { schema };
