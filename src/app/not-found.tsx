import Link from "next/link";

import { LogoSymbol } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoSymbol className="h-16 w-auto text-light-purple" />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">
        That page is not here
      </h1>
      <p className="mt-2 max-w-md text-muted">
        The link may be out of date, or the project may have been renamed in the
        planning workbook.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-royal-purple px-6 py-3 text-sm font-bold text-white hover:bg-deep-blue"
      >
        Back to your dashboard
      </Link>
    </main>
  );
}
