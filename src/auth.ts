import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { db, isDatabaseConfigured } from "@/db";
import { users, type Role } from "@/db/schema";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Google sign-in is only wired up when credentials are present, so the app
 * still boots on a fresh Vercel project with nothing but AUTH_SECRET set.
 */
const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success || !isDatabaseConfigured()) return null;

        const [user] = await db()
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email.toLowerCase()))
          .limit(1);

        if (!user?.passwordHash) return null;
        if (!(await compare(parsed.data.password, user.passwordHash))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Google accounts are admitted only from the school domain, and only if
     * someone has already been added to the roster — the LMS is not
     * self-service.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      const domain = process.env.ALLOWED_EMAIL_DOMAIN;
      if (!email) return false;
      if (domain && !email.endsWith(`@${domain}`)) return false;
      if (!isDatabaseConfigured()) return false;

      const [existing] = await db()
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existing) return false;

      (user as { id?: string }).id = existing.id;
      (user as { role?: Role }).role = existing.role;
      return true;
    },
  },
});

export const isGoogleEnabled = googleEnabled;
