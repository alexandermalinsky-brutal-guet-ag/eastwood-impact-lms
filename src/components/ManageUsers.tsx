"use client";

import { useState } from "react";

import { createUser, resetPassword, setActive, setRole } from "@/lib/actions";
import { Button, buttonClass } from "@/components/ui";
import type { Role } from "@/db/schema";

type Person = {
  id: string; name: string | null; email: string; role: Role;
  grade: string | null; phase: "exploration" | "execution" | "legacy";
  enabled: boolean; active: number; complete: number;
};

type Handover = { email: string; password: string; generated: boolean };

const ROLES: Role[] = ["student", "coach", "admin"];

/**
 * Shown once, after the server hands back a password. It is never stored in
 * plaintext anywhere, so if this panel is dismissed without the password being
 * written down, the only way back is to reset it again.
 */
function Credentials({ handover, onDone }: { handover: Handover; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mb-6 rounded-[14px] border-2 border-forest-green bg-forest-green/5 p-5">
      <h3 className="font-bold text-ink">
        {handover.generated ? "Password generated" : "Account created"}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Give this to {handover.email} directly. It is shown once — we store only a
        hash, so nobody, including you, can look it up again. If it is lost, reset it.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink">
          {handover.password}
        </code>
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={() => {
            void navigator.clipboard?.writeText(handover.password);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" className={buttonClass("ghost")} onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

export function ManageUsers({ people, meId }: { people: Person[]; meId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [handover, setHandover] = useState<Handover | null>(null);
  const [role, setRoleField] = useState<Role>("student");
  const [open, setOpen] = useState(false);

  async function run(work: () => Promise<Handover | void>) {
    setBusy(true);
    setError("");
    try {
      const result = await work();
      if (result) setHandover(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {handover ? (
        <Credentials handover={handover} onDone={() => setHandover(null)} />
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {open ? (
        <form
          className="card mb-8 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            void run(async () => {
              const result = await createUser(new FormData(form));
              form.reset();
              setRoleField("student");
              setOpen(false);
              return result;
            });
          }}
        >
          <h2 className="mb-4 text-lg font-bold text-ink">Add someone</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Full name</span>
              <input
                name="name" required maxLength={120} placeholder="Anna Schmid"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">School email</span>
              <input
                name="email" type="email" required maxLength={200} placeholder="anna.schmid@eastwood.global"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Role</span>
              <select
                name="role" value={role} onChange={(e) => setRoleField(e.target.value as Role)}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm capitalize text-ink"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>

            {role === "student" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Grade</span>
                  <input
                    name="grade" maxLength={10} placeholder="10"
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Phase</span>
                  <select
                    name="phase" defaultValue="exploration"
                    className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                  >
                    <option value="exploration">Exploration</option>
                    <option value="execution">Execution</option>
                    <option value="legacy">Legacy</option>
                  </select>
                </label>
              </div>
            ) : <div />}

            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Password <span className="font-medium normal-case tracking-normal">— leave blank and one will be generated</span>
              </span>
              <input
                name="password" type="text" maxLength={200} autoComplete="off"
                placeholder="Leave blank (recommended)"
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
            <button type="button" className={buttonClass("ghost")} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setOpen(true)} className="mb-8">Add someone</Button>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Email</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Projects</th>
              <th className="px-4 py-3 text-right font-bold">Account</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const isMe = p.id === meId;
              return (
                <tr key={p.id} className={`border-t border-line ${p.enabled ? "" : "opacity-55"}`}>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {p.name ?? "—"}
                    {isMe ? <span className="ml-2 text-xs font-normal text-muted">you</span> : null}
                    {p.enabled ? null : <span className="ml-2 text-xs font-normal text-muted">archived</span>}
                    {p.role === "student" && p.grade ? (
                      <span className="block text-xs font-normal text-muted">Grade {p.grade} · {p.phase}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.email}</td>
                  <td className="px-4 py-3">
                    {/* Changing your own role is how an admin locks themselves out. */}
                    {isMe ? (
                      <span className="capitalize text-muted">{p.role}</span>
                    ) : (
                      <select
                        value={p.role}
                        disabled={busy}
                        onChange={(e) => void run(() => setRole(p.id, e.target.value as Role))}
                        aria-label={`Role for ${p.name ?? p.email}`}
                        className="rounded-lg border border-line bg-surface px-2 py-1 text-sm capitalize text-ink"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {p.active} active{p.complete ? `, ${p.complete} done` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button" disabled={busy}
                        aria-label={`Reset password for ${p.name ?? p.email}`}
                        onClick={() => void run(() => resetPassword(p.id))}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-bold text-muted hover:border-light-purple hover:text-royal-purple"
                      >
                        Reset password
                      </button>
                      {isMe ? null : (
                        <button
                          type="button" disabled={busy}
                          aria-label={`${p.enabled ? "Archive" : "Restore"} ${p.name ?? p.email}`}
                          onClick={() => void run(() => setActive(p.id, !p.enabled))}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-bold text-muted hover:border-light-purple hover:text-royal-purple"
                        >
                          {p.enabled ? "Archive" : "Restore"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
