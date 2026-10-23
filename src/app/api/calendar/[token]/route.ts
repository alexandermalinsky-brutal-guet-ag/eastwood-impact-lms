import { eq } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { enrolments, milestones, users } from "@/db/schema";
import { getProject } from "@/lib/curriculum";

/**
 * A per-student iCalendar feed of project deadlines.
 *
 * Google Calendar (and Apple Calendar, and Outlook) fetch this URL on a
 * schedule with no session, so the token in the path is the only credential.
 * That is why this route sits outside the auth proxy — and why the token is a
 * UUID rather than the user id.
 */
export const dynamic = "force-dynamic";

/**
 * Folds long lines to 75 **octets**, as RFC 5545 requires — not 75 characters.
 * A tick or an accent is multiple bytes, so counting characters silently
 * produces lines Google rejects.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;

  // Split by code point so a multi-byte character is never cut in half.
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      out.push(current);
      current = " ";      // continuation lines begin with a space
      bytes = 1;
      limit = 75;
    }
    current += char;
    bytes += size;
  }
  if (current) out.push(current);
  return out.join("\r\n");
}

function escape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateOnly = (iso: string) => iso.replace(/-/g, "");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!isDatabaseConfigured() || !token || token.length < 16) {
    return new Response("Not found", { status: 404 });
  }

  const [user] = await db()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.calendarToken, token))
    .limit(1);

  if (!user) return new Response("Not found", { status: 404 });

  const rows = await db()
    .select({
      title: milestones.title,
      dueDate: milestones.dueDate,
      done: milestones.done,
      projectSlug: enrolments.projectSlug,
      ownTitle: enrolments.ownTitle,
      indicatorName: enrolments.indicatorName,
      indicatorTarget: enrolments.indicatorTarget,
    })
    .from(milestones)
    .innerJoin(enrolments, eq(milestones.enrolmentId, enrolments.id))
    .where(eq(enrolments.userId, user.id));

  const now = stamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Eastwood Montreux//IMPACT//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:IMPACT deadlines",
    "X-WR-CALDESC:Milestones from your IMPACT projects",
    // Tells Google how often to re-fetch. It treats this as a hint.
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const row of rows) {
    if (!row.dueDate) continue;
    const project = row.ownTitle || getProject(row.projectSlug)?.title || "IMPACT project";
    const uid = `${row.projectSlug}-${row.dueDate}-${row.title}`
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 60);

    // All-day events: DTEND is exclusive, so it is the day after.
    const end = new Date(row.dueDate);
    end.setDate(end.getDate() + 1);

    const description = [
      `Project: ${project}`,
      row.indicatorName ? `Working toward: ${row.indicatorName} → ${row.indicatorTarget}` : "",
      row.done ? "Status: done" : "Status: still open",
    ].filter(Boolean).join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${uid}@eastwood-impact-lms`),
      fold(`DTSTAMP:${now}`),
      fold(`DTSTART;VALUE=DATE:${dateOnly(row.dueDate)}`),
      fold(`DTEND;VALUE=DATE:${dateOnly(end.toISOString().slice(0, 10))}`),
      fold(`SUMMARY:${row.done ? "✓ " : ""}${escape(row.title)}`),
      fold(`DESCRIPTION:${escape(description)}`),
      fold(`URL:https://eastwood-impact-lms.vercel.app/projects/${row.projectSlug}`),
      fold(`STATUS:${row.done ? "COMPLETED" : "CONFIRMED"}`),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="impact-deadlines.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
