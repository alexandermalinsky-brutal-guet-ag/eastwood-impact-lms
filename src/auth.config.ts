import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/db/schema";

/**
 * Edge-safe half of the auth setup. This file is imported by middleware, so it
 * must not pull in bcrypt, the database, or anything else with a Node
 * dependency. Providers are added in src/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? "student";
        token.uid = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = (token.role as Role) ?? "student";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
