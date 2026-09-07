import Link from "next/link";
import type { ReactNode } from "react";

import type { Strand } from "@/lib/brand";
import { UNASSIGNED } from "@/lib/brand";

export function StrandChip({
  strand,
  size = "sm",
}: {
  strand: Strand | null;
  size?: "sm" | "md";
}) {
  const tone = strand ?? UNASSIGNED;
  return (
    <span
      // w-fit/self-start keep the pill from stretching when it is a direct
      // child of a stretching flex column, as it is inside ProjectCard.
      className={`inline-flex w-fit self-start items-center gap-1.5 rounded-full font-semibold tracking-wide ${
        size === "sm" ? "px-2.5 py-0.5 text-[0.68rem]" : "px-3 py-1 text-xs"
      }`}
      style={{ background: tone.colour, color: tone.ink }}
    >
      {strand ? (
        <span className="font-bold opacity-70">{strand.letter}</span>
      ) : null}
      {tone.name}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-royal-purple">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight text-ink">{title}</h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  value,
  label,
  accent,
}: {
  value: ReactNode;
  label: string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p
        className="text-3xl font-bold tabular-nums tracking-tight"
        style={{ color: accent ?? "var(--color-deep-blue)" }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
    </div>
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="card border-dashed p-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {children ? (
        <div className="mx-auto mt-1.5 max-w-md text-sm text-muted">{children}</div>
      ) : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      {...props}
      className={`${buttonClass(variant)} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClass(variant)} ${className}`}>
      {children}
    </Link>
  );
}

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55";
  const variants = {
    primary: "bg-royal-purple text-white hover:bg-deep-blue",
    secondary:
      "border border-line bg-surface text-ink hover:border-light-purple hover:text-royal-purple",
    ghost: "text-muted hover:bg-white hover:text-royal-purple",
    danger: "border border-line bg-surface text-muted hover:border-red-300 hover:text-red-700",
  };
  return `${base} ${variants[variant]}`;
}
