import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Logo, LogoSymbol } from "@/components/Logo";

export default async function Landing() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-dvh">
      <section className="brand-gradient relative overflow-hidden text-white">
        <LogoSymbol className="pointer-events-none absolute -right-16 -top-20 h-[26rem] w-auto text-white/[0.06]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-8">
          <Logo tone="reversed" />

          <div className="mt-20 max-w-3xl">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-light-purple">
              Who benefits · What changes · How we know
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Projects that leave
              <br />
              something behind.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Students pick something that matters, say who it is for and what
              would be different, then prove it changed. Every step backed by
              evidence a coach has seen.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/signin"
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-deep-blue transition-colors hover:bg-light-purple"
              >
                Sign in
              </Link>
              <span className="text-sm text-white/60">
                School accounts only
              </span>
            </div>
          </div>

          <dl className="mt-20 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {[
              { value: "Create", label: "Say who it is for and what would change" },
              { value: "Plan", label: "Dated milestones and a definition of done" },
              { value: "Prove", label: "Evidence a coach validates, level by level" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-3xl font-bold">{stat.value}</dt>
                <dd className="mt-1 text-sm text-white/65">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Logo />
          <p className="text-xs text-muted">
            IMPACT programme · internal platform
          </p>
        </div>
      </footer>
    </main>
  );
}
