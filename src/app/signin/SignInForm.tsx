"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { buttonClass } from "@/components/ui";

export function SignInForm({
  next,
  googleEnabled,
  disabled,
  initialError,
}: {
  next: string;
  googleEnabled: boolean;
  disabled: boolean;
  initialError: string;
}) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (result?.error) {
      setError("That email and password combination did not work.");
      setPending(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mt-7">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={disabled || pending}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 disabled:opacity-60"
            placeholder="you@eastwoodmontreux.ch"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-muted"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={disabled || pending}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink disabled:opacity-60"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={disabled || pending}
          className={`${buttonClass("primary")} w-full py-2.5`}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => signIn("google", { redirectTo: next })}
            className={`${buttonClass("secondary")} w-full py-2.5`}
          >
            Continue with your school Google account
          </button>
        </>
      ) : null}
    </div>
  );
}
