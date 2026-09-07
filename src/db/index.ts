import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * The database is resolved lazily so that `next build` succeeds before a
 * Postgres store has been attached to the Vercel project. Anything that
 * touches `db()` must run at request time, never during prerender.
 */
let cached: ReturnType<typeof create> | null = null;

function create(url: string) {
  return drizzle(neon(url), { schema });
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}

export function db() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "No DATABASE_URL. Attach a Postgres store to this Vercel project (Storage → Create Database), then redeploy.",
    );
  }
  cached ??= create(url);
  return cached;
}

export { schema };
