# Bibliotek

Et utlånssystem for et lite bibliotek. Bygget med Next.js (App Router),
TypeScript og Tailwind. Grensesnittet er på norsk, koden på engelsk.

Dette er en demo: det finnes ingen database og ingen ekte innlogging.

## Kom i gang

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # Vitest — forretningsreglene
npm run reset-data # tilbake til utgangspunktet i data/seed.json
```

## Sider

| Adresse | Hva den gjør |
| --- | --- |
| `/` | Hele samlingen, med hvor mange eksemplarer som er ledige |
| `/boker/[id]` | Detaljer om én tittel, og knappen som låner eller reserverer den |
| `/mine-laan` | Lånene og reservasjonene dine, med frister, status og gebyr |
| `/admin` | Alle aktive lån, med registrering av retur |
| `/admin/reservasjoner` | Hele reservasjonskøen, med utlevering og sletting |
| `/admin/brukere` | Brukerregisteret — alle lånere og bibliotekarer |
| `/admin/innstillinger` | Innstillinger for demoen, og tilbakestilling av datagrunnlaget |
| `/logg-inn` | Velg hvem du vil bruke systemet som |
| `/stil` | Stilguiden — alle komponenter og tilstander på én side |

## API

```
GET  /api/books              GET  /api/books/[id]
GET  /api/loans/mine         POST /api/loans
POST /api/loans/[id]/return
```

## Datalaget

Ingen database. [`lib/db.ts`](lib/db.ts) er den eneste modulen som rører disk:

- `data/seed.json` er sjekket inn og skrives aldri til
- `data/db.json` er arbeidskopien, lages fra seed ved første lesing, og er
  ignorert av git

Filen holder `books`, `borrowers`, `loans` og `reservations`. En arbeidskopi som
ble skrevet før et felt fantes, fylles ut ved lesing — en `db.json` fra før
reservasjonene får en tom kø, ikke ingen kø.

Alle operasjoner går gjennom én kø, slik at ingen leser en halvskrevet fil og to
samtidige utlån ikke kan ta samme siste eksemplar. Det er også derfor en retur
og avsettingen av det innleverte eksemplaret er **én** skriving: to skrivinger
ville latt en forbipasserende låne boken i mellomtiden.

## Roller og innlogging

Det finnes ingen passord. [`lib/auth.ts`](lib/auth.ts) er den ene skjøten hele
appen leser brukeren gjennom — å bytte til ekte autentisering betyr å skrive om
den filen og ingen andre.

En person er enten `borrower` eller `librarian`. Bibliotekarer ser
administrasjonen; alle andre får en forklaring og veien videre i stedet.

Cookien `borrowerId` avgjør hvem du er:

| Cookie | Hvem du er |
| --- | --- |
| mangler | første låner i seed — så demoen alltid åpner på noe som virker |
| en id | den personen |
| `none` | ingen, satt av en bevisst utlogging |

## Forretningsregler

- Et lån løper i **28 dager** fra utlånsdagen
- Ledige eksemplarer er `copies − aktive lån − eksemplarer satt av til henting`
- Gebyret er **10 kr per dag** etter forfall, med tak på **200 kr**. Et innlevert
  lån beholder gebyret det hadde den dagen boken kom tilbake
- En bok kan **reserveres** bare når alle eksemplarer er opptatt. Står det et
  eksemplar i hyllen, låner du det i stedet
- Køen er **først til mølla**. Når et eksemplar leveres inn, settes det av til
  den første i køen, og ingen andre kan låne det før det er hentet
- Én reservasjon per person per tittel, og du kan ikke reservere en tittel du
  har ute på lån
- Ingenting utløper: et eksemplar står avsatt til det hentes eller reservasjonen
  sies fra seg

Reglene ligger i [`lib/fees.ts`](lib/fees.ts),
[`lib/availability.ts`](lib/availability.ts) og
[`lib/reservations.ts`](lib/reservations.ts), og er dekket av tester. Dager
telles i hele UTC-døgn, så klokkeslettet aldri gjør en innlevering forsinket.

## Design

Se [`docs/design/CLAUDE.md`](docs/design/CLAUDE.md) før du endrer noe visuelt.
[`/stil`](app/stil/page.tsx) er den levende referansen og holdes i takt med
språket.

## Ideer

[`docs/ideas/`](docs/ideas/CLAUDE.md) er en idébank: forbedringer som er vurdert
mot koden, men ikke bygget. Hver av dem er skrevet som en ferdig prompt.
