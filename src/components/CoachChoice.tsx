"use client";

export type Coach = { id: string; name: string | null; email: string };

/**
 * Picking the coach you have been assigned to. A list of real people rather
 * than a dropdown, because there are a handful of coaches and a student
 * should recognise the name rather than hunt for it.
 */
export function CoachChoice({
  coaches,
  value,
  onChange,
}: {
  coaches: Coach[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (coaches.length === 0) {
    return (
      <p className="rounded-lg border border-mustard/50 bg-mustard/10 px-3 py-2.5 text-sm leading-relaxed text-ink">
        No coaches have accounts yet, so there is nobody to assign you to. You
        can still start the project — a coach can be added to it later.
      </p>
    );
  }

  return (
    <fieldset className="space-y-1.5">
      <legend className="sr-only">Your assigned coach</legend>
      {coaches.map((coach) => {
        const chosen = value === coach.id;
        return (
          <label
            key={coach.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              chosen
                ? "border-royal-purple bg-royal-purple/5"
                : "border-line bg-surface hover:border-light-purple"
            }`}
          >
            <input
              type="radio"
              name="coachId"
              value={coach.id}
              checked={chosen}
              onChange={() => onChange(coach.id)}
              className="h-4 w-4 accent-royal-purple"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">
                {coach.name ?? coach.email}
              </span>
              <span className="block truncate text-xs text-muted">{coach.email}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
