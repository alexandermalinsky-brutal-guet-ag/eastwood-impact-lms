"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import type { Role } from "@/db/schema";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/strands", label: "Strands" },
  { href: "/projects", label: "Projects" },
  { href: "/toolkit", label: "Toolkit" },
];

export function Nav({
  user,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = user.role === "student" ? LINKS : [...LINKS, { href: "/staff", label: "Staff" }];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/dashboard" className="shrink-0" aria-label="IMPACT home">
          <Logo className="scale-[0.92] origin-left" />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-royal-purple text-white"
                    : "text-muted hover:bg-white hover:text-royal-purple"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-ink">
              {user.name ?? user.email}
            </p>
            <p className="text-[0.68rem] font-medium uppercase tracking-wider text-muted">
              {user.role}
            </p>
          </div>
          <form action="/api/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-light-purple hover:text-royal-purple"
            >
              Sign out
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="rounded-lg border border-line bg-surface p-2 md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M2 5h16v2H2zM2 9h16v2H2zM2 13h16v2H2z" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-surface px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
