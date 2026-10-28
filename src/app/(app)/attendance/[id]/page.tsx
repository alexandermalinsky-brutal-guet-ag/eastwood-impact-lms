import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Register } from "@/components/Attendance";
import { SectionHeading } from "@/components/ui";
import { formatDueDate } from "@/lib/dates";
import { attendanceRegister } from "@/lib/queries";

export const metadata: Metadata = { title: "Register" };
export const dynamic = "force-dynamic";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session!.user.role === "student") redirect("/dashboard");

  const { id } = await params;
  const data = await attendanceRegister(id);
  if (!data) notFound();

  return (
    <>
      <Link href="/attendance" className="text-sm font-semibold text-muted hover:text-royal-purple">
        ← All registers
      </Link>

      <div className="mt-4">
        <SectionHeading
          eyebrow={formatDueDate(data.session.date, {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
          title={data.session.title || "Structured work session"}
          description="Nobody is marked until you mark them. A mark records who made it, so a student can take it up with you."
        />
      </div>

      <Register sessionId={data.session.id} roster={data.roster} />
    </>
  );
}
