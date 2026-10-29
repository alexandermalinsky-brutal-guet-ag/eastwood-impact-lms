import type { Role } from "@/db/schema";

/**
 * Managing accounts is an admin job. One exception: the platform's owner
 * holds a student account on purpose — so the student demo is a real student
 * account rather than an admin pretending — but still needs to add people.
 *
 * Granting this is granting the ability to create admins. Keep the list short.
 */
const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? "alexander.malinsky@eastwood.global")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function canManageUsers(user: {
  role: Role;
  email?: string | null;
}): boolean {
  if (user.role === "admin") return true;
  const email = user.email?.toLowerCase();
  return Boolean(email && OWNER_EMAILS.includes(email));
}
