import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ManageUsers } from "@/components/ManageUsers";
import { SectionHeading } from "@/components/ui";
import { canManageUsers } from "@/lib/access";
import { staffOverview } from "@/lib/queries";

export const metadata: Metadata = { title: "Accounts" };
export const dynamic = "force-dynamic";

/**
 * Adding and managing accounts. Separate from the Programme page, which is
 * about where students are in the work — this one is about who can get in.
 */
export default async function AccountsPage() {
  const session = await auth();
  if (!canManageUsers(session!.user)) redirect("/dashboard");

  const people = await staffOverview();

  return (
    <>
      <SectionHeading
        eyebrow="Accounts"
        title="Who can get in"
        description="Add students, coaches and admins. Passwords are shown once when they are created — we store a hash, so there is nothing to look up later."
      />

      <ManageUsers people={people} meId={session!.user.id} />
    </>
  );
}
