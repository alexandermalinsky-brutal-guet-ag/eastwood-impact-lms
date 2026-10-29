/**
 * Dates are formatted in the school's timezone, never the viewer's and never
 * the server's.
 *
 * Without a fixed zone, a date rendered inside a client component is formatted
 * in UTC on the server and in local time in the browser. Locally those are the
 * same zone so nothing shows; on Vercel they differ and React throws a
 * hydration mismatch. Everyone using this is in Montreux, so pinning the zone
 * is both the fix and the correct behaviour.
 */
const ZONE = "Europe/Zurich";

/** A timestamp from the database. */
export function formatDate(value: Date): string {
  return value.toLocaleDateString("en-GB", { timeZone: ZONE });
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString("en-GB", { timeZone: ZONE });
}

export function formatLongDate(value: Date): string {
  return value.toLocaleDateString("en-GB", {
    timeZone: ZONE, day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * A due date — a calendar day with no time of day, stored as "2026-10-30".
 * Read back as UTC midnight and formatted as UTC, so the day never shifts.
 */
export function formatDueDate(value: string, options: Intl.DateTimeFormatOptions = {}): string {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    timeZone: "UTC", ...options,
  });
}

/**
 * "3 days ago". Call this on the server only and pass the string down: it
 * reads the clock, so computing it again during hydration would produce a
 * different answer and tear the page — the same class of bug as above.
 */
export function formatRelative(value: Date, now: Date = new Date()): string {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const format = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
}
