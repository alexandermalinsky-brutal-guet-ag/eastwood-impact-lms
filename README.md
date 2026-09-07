# IMPACT

The project learning platform for the IMPACT programme at **Eastwood Montreux
International School**.

Students choose a project from the programme menu, run it through the school's
own Plan – Act – Reflect cycle, and build a record that stands up at demo time.
Staff get a view of where students are actually going and which parts of the
plan still need a person against them.

---

## What is in here

| Area | Route | What it does |
| --- | --- | --- |
| Landing | `/` | Public front page; redirects to the dashboard once signed in |
| Dashboard | `/dashboard` | Your active projects, open tasks, next actions |
| Strands | `/strands` | The six IMPACT strands and what each one is for |
| Projects | `/projects` | All 87 projects, filterable by strand and searchable |
| Project workspace | `/projects/[slug]` | Kanban board, success criteria, Plan · Act · Reflect cycles |
| Toolkit | `/toolkit` | 58 teaching practices, 9 of them flagged as core |
| Staff | `/staff` | Take-up, roster, and the gaps in the plan (staff and admin only) |

### The six strands

**I**magination · **M**ovement · **P**lanet · **A**ction · **C**haracter ·
**T**echnology — each assigned one colour from the school's secondary palette.

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
surface as "Needs a strand" on `/strands` and `/staff` for a human to place.

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
npm run db:seed                # create the first accounts
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

`scripts/dev-student.ts` creates a throwaway student account for testing:
`npm run db:seed && node node_modules/tsx/dist/cli.mjs scripts/dev-student.ts`.

The app is built to survive not having one: pages render, the curriculum is
readable, and anything that needs to persist shows a clear warning instead of
crashing. That way the first deploy succeeds before the store exists.

### Accounts

`npm run db:seed` creates a coach account for everyone named as a point person
in the planning workbook, plus an `impact@` admin. It prints a shared bootstrap
password once — **change these on first sign-in.** Set `SEED_PASSWORD` to choose
your own.

Sign-in is email and password by default. To add Google Workspace sign-in, set
`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`; accounts still have to exist on the
platform first, and are restricted to `ALLOWED_EMAIL_DOMAIN`. The platform is
not self-service by design.

### Roles

`student` joins projects · `coach` also sees project rosters · `admin` also sees
`/staff`.

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
