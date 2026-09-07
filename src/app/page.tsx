import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Logo, LogoSymbol } from "@/components/Logo";
import { STRANDS } from "@/lib/brand";
import { projects, resources } from "@/lib/curriculum";

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
              Imagination · Movement · Planet · Action · Character · Technology
            </p>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Projects that leave
              <br />
              something behind.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              IMPACT is where Eastwood Montreux students choose real work, plan
              it, do it, and show what changed. This is the platform that keeps
              track of all of it.
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
              { value: projects.length, label: "Projects on the menu" },
              { value: STRANDS.length, label: "IMPACT strands" },
              { value: resources.length, label: "Teaching practices" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-4xl font-bold tabular-nums">{stat.value}</dt>
                <dd className="mt-1 text-sm text-white/65">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-royal-purple">
          The six strands
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STRANDS.map((strand) => (
            <div
              key={strand.slug}
              className="rounded-[14px] p-6"
              style={{ background: strand.colour, color: strand.ink }}
            >
              <p className="text-4xl font-bold leading-none opacity-40">
                {strand.letter}
              </p>
              <h3 className="mt-4 text-xl font-bold">{strand.name}</h3>
              <p className="mt-1.5 text-sm font-medium opacity-80">
                {strand.definition}
              </p>
            </div>
          ))}
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
