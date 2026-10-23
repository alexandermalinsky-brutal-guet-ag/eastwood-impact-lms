import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { CalendarConnect } from "@/components/CalendarConnect";
import { Empty, SectionHeading } from "@/components/ui";
import { getProject } from "@/lib/curriculum";
import { myCalendarToken, upcomingDeadlines } from "@/lib/queries";

export const metadata: Metadata = { title: "Deadlines" };
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** Groups by how soon, because "when" is the only question this page answers. */
function bucketOf(dueDate: string): "overdue" | "week" | "month" | "later" {
  const diff = Date.parse(dueDate) - Date.now();
  if (diff < 0) return "overdue";
  if (diff < 7 * DAY) return "week";
  if (diff < 31 * DAY) return "month";
  return "later";
}

const BUCKETS = [
  { key: "overdue", label: "Overdue", tone: "text-mustard" },
  { key: "week", label: "This week", tone: "text-royal-purple" },
  { key: "month", label: "This month", tone: "text-ink" },
  { key: "later", label: "Later", tone: "text-muted" },
] as const;

export default async function CalendarPage() {
  const session = await auth();
  const user = session!.user;

  const [token, deadlines] = await Promise.all([
    myCalendarToken(user.id),
    upcomingDeadlines(user.id),
  ]);

  const host = (await headers()).get("host") ?? "eastwood-impact-lms.vercel.app";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const feedUrl = token ? `${protocol}://${host}/api/calendar/${token}` : "";

  return (
    <>
      <SectionHeading
        eyebrow="Deadlines"
        title="What is due, and when"
        description="Every milestone across your projects, soonest first."
      />

      {deadlines.length === 0 ? (
        <Empty title="Nothing dated yet">
          Milestones get dates on a project&rsquo;s Plan tab. Three to six of them, ending at the
          showcase — they are what appears here and in your calendar.
        </Empty>
      ) : (
        <div className="space-y-8">
          {BUCKETS.map((bucket) => {
            const items = deadlines.filter((d) => bucketOf(d.dueDate) === bucket.key);
            if (items.length === 0) return null;
            return (
              <section key={bucket.key}>
                <h2 className={`mb-3 text-sm font-bold uppercase tracking-[0.16em] ${bucket.tone}`}>
                  {bucket.label} <span className="tabular-nums opacity-60">{items.length}</span>
                </h2>
                <ul className="space-y-2">
                  {items.map((d) => {
                    const project = d.ownTitle || getProject(d.projectSlug)?.title || d.projectSlug;
                    return (
                      <li key={d.id}>
                        <Link
                          href={`/projects/${d.projectSlug}`}
                          className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-light-purple"
                        >
                          <div className="min-w-0">
                            <p className={`font-semibold leading-snug ${d.done ? "text-muted line-through" : "text-ink"}`}>
                              {d.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{project}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-semibold tabular-nums ${bucket.key === "overdue" ? "text-mustard" : "text-muted"}`}>
                            {new Date(d.dueDate).toLocaleDateString("en-GB", {
                              weekday: "short", day: "numeric", month: "short",
                            })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        {feedUrl ? (
          <CalendarConnect feedUrl={feedUrl} />
        ) : (
          <Empty title="Calendar link unavailable">
            Your account has no calendar token yet. Sign out and back in, or ask the IMPACT team.
          </Empty>
        )}
      </div>
    </>
  );
}
