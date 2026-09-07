import type { Metadata } from "next";
import Link from "next/link";

import { isGoogleEnabled } from "@/auth";
import { Logo, LogoSymbol } from "@/components/Logo";
import { isDatabaseConfigured } from "@/db";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const ready = isDatabaseConfigured();

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="brand-gradient relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <LogoSymbol className="pointer-events-none absolute -bottom-24 -left-16 h-[30rem] w-auto text-white/[0.07]" />
        <Logo tone="reversed" />
        <div className="relative max-w-sm">
          <p className="text-3xl font-bold leading-tight tracking-tight">
            Plan it. Act on it. Reflect on what actually happened.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Every IMPACT project runs the same cycle, and the platform keeps the
            record so the work speaks for itself at demo time.
          </p>
        </div>
        <p className="relative text-xs text-white/45">
          Eastwood Montreux International School
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-10 text-2xl font-bold tracking-tight text-ink lg:mt-0">
            Sign in to IMPACT
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Use the account the IMPACT team set up for you.
          </p>

          {!ready ? (
            <div className="mt-6 rounded-lg border border-mustard/40 bg-mustard/10 p-4 text-sm text-ink">
              <p className="font-semibold">Database not connected yet</p>
              <p className="mt-1 text-muted">
                Attach a Postgres store to this Vercel project, run the
                migration and seed, then reload. See{" "}
                <span className="font-mono text-xs">README.md</span>.
              </p>
            </div>
          ) : null}

          <SignInForm
            next={params.next ?? "/dashboard"}
            googleEnabled={isGoogleEnabled}
            disabled={!ready}
            initialError={params.error ? "Sign in failed. Check your details and try again." : ""}
          />

          <p className="mt-8 text-xs leading-relaxed text-muted">
            Trouble signing in? Ask the IMPACT team to check your account.{" "}
            <Link href="/" className="font-semibold text-royal-purple underline">
              Back to the front page
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
