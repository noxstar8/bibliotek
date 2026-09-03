# Administrasjonen

Skrankearbeidet: alt en bibliotekar gjør som en vanlig låner ikke skal se.
Les `CLAUDE.md` i roten for lagdelingen og `docs/design/CLAUDE.md` for
designspråket først — dette dokumentet sier bare hva som er særegent for
`app/(app)/admin/`.

Sidene her er **server-komponenter uten unntak**. Ingen `"use client"` i denne
mappen: trenger noe state, ligger den i en klientkomponent under `components/`
som siden importerer (`ReservationActions`, `BorrowerRole`, `DeleteBook`,
`BookForm`, `ResetDemoData`).

## Sidekartet

| Rute | Fil | Hva den er |
| --- | --- | --- |
| `/admin` | `page.tsx` | Aktive lån, med «Registrer retur» |
| `/admin/reservasjoner` | `reservasjoner/page.tsx` | Hele køen, utlevering og sletting |
| `/admin/boker` | `boker/page.tsx` | Katalogen |
| `/admin/boker/ny` | `boker/ny/page.tsx` | Skjema for ny tittel |
| `/admin/boker/[id]` | `boker/[id]/page.tsx` | Rediger tittel + faresone |
| `/admin/brukere` | `brukere/page.tsx` | Brukerregisteret |
| `/admin/brukere/[id]` | `brukere/[id]/page.tsx` | Lånekortet |
| `/admin/innstillinger` | `innstillinger/page.tsx` | Demooppsett, tilbakestilling |

En ny toppnivåside må legges inn i `views`-listen i
[`components/admin-nav.tsx`](../../../components/admin-nav.tsx) — ellers finnes
den, men ingen kommer til den.

## Skjelettet hver side følger

Alle åtte sidene har samme rekkefølge. Kopier den i stedet for å finne på en ny:

```tsx
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "… – Bibliotek", description: "…" };

export default async function Page({ searchParams }: PageProps<"/admin/…">) {
  const user = await requireBorrower();
  if (!isLibrarian(user)) {
    return (
      <>
        <PageHeading title="…" />
        <LibrarianRequired user={user} />
      </>
    );
  }

  const [data, { feil, … }] = await Promise.all([listSomething(), searchParams]);
  const error = describeError(feil);

  return (
    <>
      <PageHeading title="…">Én setning om hva siden er til for.</PageHeading>
      <AdminNav />              {/* eller <Breadcrumbs /> — se under */}
      {/* feil-alert, så kvitterings-alerts */}
      {/* Empty hvis listen er tom, ellers Card med Table */}
    </>
  );
}
```

Fire ting som ikke er valgfrie:

- **`export const dynamic = "force-dynamic"`** — hver side leser db-en og
  cookien; uten den blir skranken servert statisk.
- **Vakten først.** `requireBorrower()` + `isLibrarian(user)`, og ved avslag
  `PageHeading` + `LibrarianRequired` — aldri `notFound()` eller redirect. En
  låner som havner her skal få vite hvorfor og få veien videre.
- **Én `Promise.all`.** `searchParams` awaites sammen med datakallene, ikke før
  eller etter. Hver `getX()` er en full lesning av filen, så hent én gang og
  utled resten lokalt (`brukere/[id]/page.tsx` finner personen i `getBorrowers()`
  i stedet for et eget `getBorrower()`-kall — da kan ikke personen og registeret
  `roleRefusal` dømmer mot være uenige).
- **`AdminNav` på toppnivåsidene, `Breadcrumbs` ett nivå ned.** Fanerekken kan
  bare si hvilken skrankevisning du er i; har du åpnet én post kan den ikke det
  lenger. Sporet starter alltid `{ label: "Administrasjon", href: "/admin" }`.

## Meldinger over innholdet

Feil kommer inn som `?feil=<slug>` og rendres alltid slik, øverst:

```tsx
{error ? (
  <Alert variant="destructive" className="mb-6">
    <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
    <AlertTitle>{error.title}</AlertTitle>
    <AlertDescription>{error.description}</AlertDescription>
  </Alert>
) : null}
```

Kvitteringer er samme `Alert` uten `variant`, med `CheckmarkCircle02Icon`. De
kommer fra query-parameteren `lib/actions.ts` redirecter til, og hver side
navngir sin egen: `?ny=`, `?slettet=`, `?lagret=1`, `?satt-av=`, `?utlevert=`,
`?rolle=`, `?tilbakestilt=1`. Legger du til en, redirect fra handlingen og les
den ut av `searchParams` — sjekk `typeof x === "string"` når verdien er et navn,
siden en query-parameter også kan være en liste.

Teksten skal si hva som skjedde, **hvilken tilstand dataene nå er i**, og hva du
gjør videre — samme tredeling som `lib/errors.ts` krever.

## Tabellene

Alle listene er samme oppskrift: `Card` → `CardHeader` (tittel, én
beskrivelsessetning, `CardAction` med en tellende `Badge`) → `CardContent
className="px-0"` → `Table`. Aldri et kort per post.

Gjenbruk fra [`components/record-cell.tsx`](../../../components/record-cell.tsx):

- `ColumnHead` — den stille kolonneoverskriften. Første får
  `className="pl-(--card-spacing)"`, siste `"pr-(--card-spacing) text-right"`.
- `IDENTITY_CELL` på `TableCell`-en rundt identitetskolonnen, `SECONDARY_CELL`
  på en eventuell **andre** to-linjers kolonne (låner ved siden av bok). Bare én
  kolonne per tabell får `IDENTITY_CELL` — to overfyller 900 px-kolonnen.
- `RecordCell` — ikonflis + navn over mutet andrelinje, `href` gjør navnet til
  lenke. Sekundærkolonnen dropper `icon`.

Cellene er `className="py-3 …"` overalt. Tallkolonner er `text-right
tabular-nums`; hovedtallet `font-medium`, støttetall `text-muted-foreground`.

`Badge`-en i `CardAction` teller det som haster først:
`overdue > 0 ? <Badge variant="destructive">{overdue} forfalt</Badge> :
<Badge variant="secondary">{loans.length} ute</Badge>`.

## Radhandlinger

Én overflow-meny per rad, aldri en knapp per handling. To varianter finnes —
velg riktig:

- **Bare lenker eller ett enkelt submit** — bygg menyen i sida selv, slik
  `page.tsx` og `boker/page.tsx` gjør. Triggeren styles med
  `buttonVariants({ variant: "ghost", size: "icon-sm" })`, **aldri**
  `render={<Button/>}` (nøstet `data-slot` gir hydreringsavvik som varierer fra
  rad til rad), og får `aria-label` som navngir posten — «Handlinger for «Sult»»
  for en tittel, «Handlinger for Ada Lovelace» for en person (« » bare der appen
  siterer i prosa).
- **Bekreftelse eller flere submits** — legg menyen i en klientkomponent, slik
  `ReservationActions` er. En `AlertDialogTrigger` inne i et menypunkt virker
  ikke: menyen unmounter popupen i det punktet trykkes, og trigger-en forsvinner
  før dialogen rekker å åpne. Dialogen må holdes åpen i state som **søsken** av
  menyen.

Et menypunkt som submitter peker på en `<form>` som ligger **utenfor**
`DropdownMenuContent`, via det native `form`-attributtet:

```tsx
<form id={`retur-${loan.id}`} action={returnLoanAction} className="hidden">
  <input type="hidden" name="loanId" value={loan.id} />
</form>
…
<DropdownMenuItem nativeButton render={<button type="submit" form={`retur-${loan.id}`} />}>
```

Rekkefølge i menyen: hverdagshandlingen først, så rediger/historikk, så
`DropdownMenuSeparator` og `variant="destructive"` sist. Punktet som bare åpner
posten heter **«Se {substantiv}»** — «Se bok», «Se bruker» — aldri «Åpne …».

## Detaljsidene

`boker/[id]` og `brukere/[id]` er bygget likt, og et nytt detaljbilde bør følge
dem: `Breadcrumbs` → `PageHeading` → alerts → et oppsummeringskort
(`CardTitle className="text-lg"`, `CardAction` med status- eller `RoleBadge`, og
en `<dl className="grid gap-6 text-sm sm:grid-cols-3">` av
[`Fact`](../../../components/fact.tsx)) → innholdet →
`<Separator className="my-10" />` → faresonen (`DeleteBook`, `BorrowerRole`).

Faresonen ligger alltid nederst, bak separatoren, og er egen klientkomponent
med sin egen `AlertDialog`. Når handlingen ikke er mulig — en tittel med
eksemplarer ute på lån — sier raden hvorfor og tilbyr ingen knapp, i stedet for
en knapp som feiler.

Et kort som ikke har noe å tilby tomt, rendres ikke i det hele tatt
(reservasjonskortet på lånekortet); et kort som *kan* stå tomt bruker `Empty`
med `className="border bg-card"` og én handling. Se kommentarene i
`brukere/[id]/page.tsx` for avveiningen.

## Komponenter som allerede finnes

Ikke bygg disse på nytt:

| Komponent | Brukes til |
| --- | --- |
| `AdminNav` | Fanerekken på toppnivåsidene |
| `Breadcrumbs` | Sporet ett nivå ned |
| `LibrarianRequired` | Avslaget i rollevakten |
| `PageHeading` | Tittelblokken hver side åpner med |
| `ColumnHead` · `RecordCell` · `IDENTITY_CELL` · `SECONDARY_CELL` | Tabellrader |
| `Fact` | Én figur med etikett i en `<dl>` |
| `RoleBadge` (+ `roleLabel`) | Rollen som `outline`-badge |
| `LoanStatusCell` · `ReservationStatusCell` | Statusbadgen utledet fra posten |
| `ReservationActions` | Radmenyen i køen, med bekreftelse |
| `BookForm` | Skjemaet for både ny og eksisterende tittel (`action` + valgfri `book`) |
| `DeleteBook` | Faresonen på en tittel |
| `BorrowerRole` | Faresonen på en bruker, med `roleRefusal`-avslaget |
| `ResetDemoData` | Tilbakestillingen i innstillinger |

Status- og rollebadger utledes alltid fra posten via `LoanStatusCell` /
`ReservationStatusCell` / `RoleBadge` — skriv aldri en `<Badge>` med håndsatt
tekst for en status som allerede har en celle.

To komponenter ligger i `components/` uten å være i bruk noe sted:
`RegisterBorrowerForm` og `BookRowActions`. Skal en side registrere en ny
bruker eller trenge en radmeny med bekreftelse på en tittel, se på dem før du
skriver noe nytt — men sjekk at de fortsatt stemmer med resten, siden ingenting
holder dem i sjakk i dag.
