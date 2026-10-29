# IMPACT

The project learning platform for the IMPACT programme at **Eastwood Montreux
International School**.

Students choose a project from the programme menu, run it through the school's
own Plan – Act – Reflect cycle, and build a record that stands up at demo time.
Coaches work from a queue of what is waiting on them, and keep the weekly
attendance register.

---

## What is in here

| Area | Route | What it does |
| --- | --- | --- |
| Landing | `/` | Public front page; redirects to the dashboard once signed in |
| Dashboard | `/dashboard` | Your projects, where each proposal stands, your attendance |
| Projects | `/projects` | The ideas board, plus the catalogue, filterable and searchable |
| Project workspace | `/projects/[slug]` | The Impact Proposal, and its approval |
| Toolkit | `/toolkit` | Teaching practices, grouped by the phase they help with |
| Handbook | `/handbook` | How to run a project here, in one page |
| Profile | `/profile` | Your phase of the programme, and every project you have started |
| Coach | `/coach` | Proposals waiting on you, and where every student stands |
| Attendance | `/attendance` | The weekly work-session registers |
| Accounts | `/admin/users` | Adding and managing people |

### What it does, and what it does not

**One loop.** A student starts a project, picks the coach they are assigned
to, writes an Impact Proposal, and sends it to that coach, who approves it or
sends it back with a reason. That is the whole platform.

Starting a project is two steps — what it is, then who is coaching you. The
first step has a second way out: an idea worth doing that you are not going to
run yourself goes on the **project ideas** board on `/projects` instead, with
no coach attached, for someone else to take on.

The rest of the programme — the dated plan, the kanban board, reflection
cycles, evidence, the level map, scorecards and the final report — was built
and then deliberately removed, to get back to something small enough to pilot.
The tables went with it (migration `0010`). Git history has all of it if any
of it comes back.

### The six strands

**I**magination · **M**ovement · **P**lanet · **A**ction · **C**haracter ·
**T**echnologies — each assigned one colour from the school's secondary palette.

Strand definitions in `src/lib/brand.ts` are taken verbatim from the handbook,
not paraphrased. Note the handbook spells the sixth strand **Technologies**;
the planning workbook says "Technology", and the extractor maps one onto the
other.

### The IMPACT Journey

Every project runs the same four stages, at every grade. What changes with
readiness is scope, ambition and independence.

1. **Ideation & Feedback** → a Project Proposal
2. **Goals & Commitments** → approval, 3–5 SMART goals, a signed Commitment Charter
3. **Development, Coaching & Execution** → reflection logs, mini-showcases
4. **Presentation, Reflection & Evaluation** → final outcome, portfolio, panel

The platform covers stage 1 and the gate at the top of stage 2. The rest
happens, it just does not live here.

`src/lib/handbook.ts` holds the definitions the app still renders — the
phases of work, the proposal fields and the progression phases. It is the
single place to change if the handbook is revised.

**Stage 2 is an approval gate.** A student can only advance one stage at a
time, and cannot move themselves into or through approval — a coach does that.
The rule lives in `setStage` in `src/lib/actions.ts`, not just in the UI.

---

## Where the content comes from

The curriculum is **not** stored in the database. It is generated from the
team's planning workbook and committed to the repository, so every change to
what is on the menu is a reviewable diff.

```
Data RAW/IMPACT curriculum resources and projects.xlsx
        │
        │  npm run data:extract
        ▼
src/data/{projects,resources,people,normalisations}.json
```

`scripts/extract_curriculum.py` is deliberately conservative:

- the original wording is always kept in `sourceTitle`
- only unambiguous spelling fixes are applied
- near-duplicate practices are merged, and the merge is recorded in
  `alsoListedAs`
- **every** change it makes is logged to `src/data/normalisations.json` so the
  team can audit what the platform changed

Projects that arrived without a strand are **not** given one by guesswork. They
surface as "Needs a strand" rather than being placed by guesswork.

The handbook expects projects to span several strands. The workbook records
one, so that is treated as the *lead* strand; the only projects carrying a real
multi-strand set are the five kickoff projects the handbook itself assigns.
Students choose the full set in their own proposal rather than having one
guessed for them.

To update the curriculum: edit the workbook, run `npm run data:extract`, review
the diff, commit.

---

## Design

Colours, logo artwork and typography come from *Eastwood Montreux — Logo
Standards / Artwork Sheet* (1 Dec 2025).

- `src/lib/brand.ts` — the palette, in one place. **Do not introduce a colour
  that is not on the artwork sheet.**
- `src/components/Logo.tsx` — the logo. The symbol paths are lifted verbatim
  from the vector artwork; do not redraw them by hand.

| | | |
| --- | --- | --- |
| Deep Blue `#000077` | Royal Purple `#500591` | Light Purple `#b494cb` |
| Apple Green `#ced93b` | Blue Purple `#5254be` | Turquoise `#01b6c9` |
| Mustard `#cd9c00` | Forest Green `#006242` | Moonrock `#65a6ba` |

---

## Running it

Requires Node 20+ and Python 3 (for the extraction script only).

```bash
npm install
cp .env.example .env.local     # then fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate             # apply drizzle/*.sql
npm run db:seed                # create the first admin, then add the rest in-app
npm run dev
```

Schema changes: edit `src/db/schema.ts`, run `npm run db:generate` to write a
new migration into `drizzle/`, review the SQL, commit it. `npm run db:push`
skips the migration file and is for throwaway local databases only.

Generate an auth secret with `npx auth secret`, or any 32+ byte random string.

### Database

Postgres. `src/db/index.ts` picks a driver from the connection string: the
Neon HTTP driver for Vercel/Neon URLs (no TCP handshake, no connection pool to
exhaust from serverless functions), and node-postgres for anything else, so
`postgres://localhost/impact_lms` works on a laptop with no cloud database.

Attach one in the Vercel dashboard: **Storage → Create Database → Postgres**,
then link it to this project. Vercel injects `DATABASE_URL` automatically.

For a local database instead:

```bash
brew install postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
export LC_ALL="en_US.UTF-8"          # Postgres 16 refuses to start without this
pg_ctl -D /opt/homebrew/var/postgresql@16 -l /tmp/pg.log start
createdb impact_lms
```

Then set `DATABASE_URL="postgres://$USER@localhost:5432/impact_lms"` in
`.env.local`. Stop it again with `pg_ctl -D /opt/homebrew/var/postgresql@16 stop`.

### The demo cohort

For a walkthrough or a pitch, the platform needs to show a system in use — an
empty one demonstrates nothing:

```bash
npm run demo           # local
npm run demo:prod      # production
npm run demo -- --clear
```

Three accounts and one project: the platform's own, with its proposal
approved, plus eight weeks of attendance. The invented cohort was removed —
one true project demos better than five fictional ones.

The coach queue is empty on a fresh seed, by design: start a second project
and submit it to see it fill. `--clear` removes the demo accounts and their
project data; re-running rebuilds the project without disturbing anyone's
signed-in session.

### Importing a student roster

For a cohort, use a CSV rather than creating accounts one at a time:

```bash
npm run roster -- --file roster.csv --year "2026/27"            # dry run
npm run roster -- --file roster.csv --year "2026/27" --commit   # create them
```

`roster-template.csv` shows the shape. Columns are `email` (required), plus
optional `name`, `grade`, `phase` and `role`, in any order. The dry run reports
what it would do and validates every row before anything is written — a bad
email or an unrecognised phase stops the whole import.

Passwords are generated, never read from the file, and written to a gitignored
`roster-credentials-<date>.csv`. Hand them out individually and delete it.

Re-running is safe: an existing email is updated rather than duplicated, and
its password is left alone unless you pass `--reset-existing`. That matters —
re-importing a roster should never lock the school out mid-term.

Against production: `npm run roster:prod -- …`.

### Student profiles

Accounts carry `grade`, `phase`, `academicYear` and `active`.

**Phase is the field that means something.** The handbook is explicit that
progression is by demonstrated readiness, not chronological age, so nothing in
the app gates on `grade` — a coach moves a student between Exploration,
Execution & Leadership and Legacy from `/admin/users`, and the student sees
where they are on `/profile`. `academicYear` lets a cohort be rolled over without
deleting history; `active` archives a leaver without destroying their record.

### Creating individual accounts

Most accounts should be added from the Accounts page. For one from the command
line — scripted onboarding, or before anyone can sign in — use:

```bash
npm run user -- --email someone@eastwoodmontreux.ch --name "Their Name" --role coach
```

`--role` is `student`, `coach` or `admin` (default `admin`). It generates a
strong password and prints it once; pass `--password` to choose one. Running it
again for an existing email updates the role but leaves the password alone
unless you add `--reset-password`.

Against production, use `npm run user:prod -- …`, which reads
`.env.prod.local`. Same for `db:migrate:prod` and `db:seed:prod`.

All `db:*` scripts read `.env.local` automatically (via Node's own
`--env-file-if-exists`, no dependency). To point one at a different database for
a one-off — a production migration, say — override it inline:

```bash
DATABASE_URL='postgres://…' npm run db:migrate
```

An inline variable wins over the env file, so this never risks pointing
`npm run dev` at production.

The app is built to survive not having one: pages render, the curriculum is
readable, and anything that needs to persist shows a clear warning instead of
crashing. That way the first deploy succeeds before the store exists.

### Accounts

People are added from the **Accounts** page (`/admin/users`) by an admin: name,
school email, role, and a password that is generated and shown once. Only a
hash is stored, so a lost password is reset rather than looked up.

`npm run db:seed` exists only for the first run on an empty database, where
there is nobody to sign in as yet. It creates one admin and prints its password
once; on a database that already has accounts it does nothing. Set
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME` or `SEED_PASSWORD` to choose your own.

It used to create a coach account for all 17 point people in the planning
workbook, sharing one password. Being named against a project in the workbook
is data; having an account is a decision somebody makes.

Sign-in is email and password by default. To add Google Workspace sign-in, set
`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; accounts still have to exist on the
platform first, and are restricted to `ALLOWED_EMAIL_DOMAIN`. The platform is
not self-service by design.

### Roles

`student` joins projects · `coach` also sees the coach queue and attendance
registers · `admin` also sees `/admin/users`.

One address can be given the Accounts page without being an admin, through
`OWNER_EMAILS` (see `src/lib/access.ts`). That exists so the platform owner can
hold a real student account — the student demo is then a student, not an admin
pretending — while still adding people.

---

## Notes for whoever picks this up next

- **`npm` scripts call binaries through `node` by path.** The working copy this
  was built in sits under a directory containing a `:`, which is the `PATH`
  separator, so `node_modules/.bin` could not be used. This is harmless
  everywhere else — if the repo lives somewhere sane, the scripts can go back to
  plain `next build` and friends.
- `drizzle-kit` pulls in an `esbuild` advisory through a transitive dependency.
  It is a schema tool that never runs in production or during the Vercel build.
- **This checkout sits in an iCloud-synced Desktop folder.** The sync duplicated
  files inside `node_modules` and even `.git/refs` as `<name> 2`, which broke
  `tsc`. If that recurs: `find . -name "* 2" -delete`. Moving the repo out of
  the synced folder avoids it entirely.
- Every write goes through an ownership check in `src/lib/actions.ts` — a
  guessed id cannot reach another student's board.
