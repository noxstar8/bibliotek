@AGENTS.md

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

Interface copy is Norwegian; code and identifiers are English.
