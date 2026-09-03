# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Commands

```bash
npm run dev          # next dev — http://localhost:3000
npm run build        # next build
npm run lint         # eslint (flat config, eslint-config-next)
npm run test         # vitest run — the business rules
npm run reset-data   # delete data/db.json so the next read rebuilds it from the seed
```

Vitest only picks up `lib/**/*.test.ts` (node environment, `@` aliased to the
repo root). Run one file with `npx vitest run lib/fees.test.ts`, one case with
`npx vitest run -t "navnet på testen"`.

# Architecture

A Next.js App Router demo of a small library's lending system. No database, no
real authentication. Read `README.md` for the page map, the API routes and the
business rules stated in full; what follows is the shape those rules live in.

## The four layers

```
app/(app)/**      server components — read through lib/*, render, no writes
lib/actions.ts    "use server" — the only place forms enter the domain
lib/{loans,books,borrowers}.ts   services — commands and *View types
lib/{availability,reservations,fees,dates,isbn}.ts   pure rules, no I/O
lib/db.ts         the only module that touches disk
```

Dependencies point downward only. `lib/reservations.ts` must never import
`lib/db.ts` or a service — `db.ts` calls `settleQueue` from inside its own
writes, so an import the other way closes a cycle. That constraint is also why
the rule modules test without a single mock.

## Persistence and the write queue

`data/seed.json` is committed and never written to; `data/db.json` is the
working copy, created from the seed on first read and git-ignored. `migrate()`
in `lib/db.ts` fills in fields a older working copy predates — add a field to
`Database` and give it a default there too.

Every operation is chained onto one promise, so writes are strictly sequential.
A rule that depends on current state is not checked before the write but
**inside** it: `createLoan`, `updateBook`, `createReservation`,
`closeReservation` and friends take a `precondition(database, …)` evaluated
against the database the write itself reads. A precondition that needs to report
*which* rule bit pushes onto a local array the caller reads back after (see
`reserveBook`, `editBook`) — the callback only returns a boolean.

Anything that frees a copy — a return, a withdrawn hold — must settle the queue
in that **same** write. Two writes would leave a moment where the copy reads as
available and a passer-by could take it from the person the queue exists to
protect. `settleQueue` is idempotent (it subtracts copies already put aside), so
any write that might free one may call it without tracking whether it already
has.

## Domain modelling

Loans and reservations carry their whole life in nullable timestamps
(`returnedAt`, `readyAt`, `closedAt` + `closedReason`) and the status is derived
from them — there is no status field to keep in sync. `readyAt` is the one thing
stored rather than derived, because a copy put aside is not available, so
availability depends on the hold and deriving the hold from availability would
be circular.

Services return `*View` types (`LoanView`, `BookView`, `ReservationView`) —
the record plus everything a screen or an API response needs — and commands
return `{ ok: true, … } | { ok: false, error }` discriminated unions, never
throw. All dates are full ISO 8601 UTC strings; days are counted in whole UTC
days (`lib/dates.ts`) so a clock time never makes a return late, and
`lib/format.ts` renders in `nb-NO` with `timeZone: "UTC"` so server and client
agree.

## Errors and forms

A failed action redirects back with `?feil=<slug>`, keeping the page a server
component. Adding an error means: add it to the service's `*Error` union, add a
Norwegian slug in `slugs` and a `{ title, description }` in `messages` in
`lib/errors.ts` — both are `Record<AppError, …>`, so a missing entry is a type
error. Every message says what happened, **what state the data is now in**, and
what to do next; keep that three-part shape.

Form actions use `useActionState` with the state types in `lib/forms.ts`, which
hold both the error and the values that were typed. Numeric fields stay strings
there — a rejected form must show back what was written, not a `0`.

## Auth and roles

`lib/auth.ts` is the single seam the app reads its user through; swapping in
real auth means rewriting that file and nothing else. The `borrowerId` cookie
decides who you are: missing → the seed's first borrower (so the demo always
opens on something that works), an id → that person, `"none"` → signed out by a
deliberate log out. A `librarian` is still a borrower; the role only adds the
desk work.

`lib/borrowers.ts` guards the register against locking everyone out — nobody may
demote themselves, and the last librarian stays a librarian.

## Revalidation

`lib/actions.ts` has three helpers, and picking the wrong one ships a stale
header: `revalidateLoanViews` for anything touching loans, reservations or
availability; `revalidateCatalogue` when a title's own fields moved;
`revalidateEverything` (`revalidatePath("/", "layout")`) for changes that reach
past a list of paths — a role, an enrolment, a demo reset — because the header
in `app/(app)/layout.tsx` renders the role above every screen.

Demo reset is gated by `DEMO_RESET_ENABLED`: on in development, off in
production unless `ALLOW_DEMO_RESET=true`.

# UI and UX

Before building or changing any UI, read @docs/design/CLAUDE.md — the design
language (palette, typography, shape, component and state conventions) for this
app.

Two reference screenshots define the look. Open them when the written rules
don't settle a question — layout density, spacing rhythm, how a pattern reads
in context:

- `docs/design/inspiration/maia-app-surfaces.png` — the language applied to real
  screens: stat blocks, transaction lists, forms, nav, breadcrumbs, danger zone
- `docs/design/inspiration/maia-components.png` — the component gallery and
  palette swatches: buttons, badges, inputs, charts, empty states, skeletons

They are the current `base-maia` style, so shape and elevation can be read
straight off them. `docs/design/inspiration/README.md` indexes what each sheet
shows and lists the two places the app deviates from them on purpose.

The app uses shadcn (`base-maia` preset, Base UI primitives, hugeicons). Add
components with `npx shadcn@latest add <name>` rather than hand-rolling them.
`/stil` is the living style guide — keep it in sync when the language changes.

Interface copy is Norwegian; code and identifiers are English. Ids that land in
a URL are Norwegian too (`bok-…`, `laaner-…`), as are error slugs and route
segments.

# Ideas

`docs/ideas/` is an idea bank — improvements weighed against the code but not
built, each written as a ready-to-paste prompt. Read `docs/ideas/CLAUDE.md`
before adding one; mark an idea done in its table rather than deleting it.
