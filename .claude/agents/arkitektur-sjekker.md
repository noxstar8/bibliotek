---
name: arkitektur-sjekker
description: Kontroller at lagdelingen i prosjektet følger reglene i CLAUDE.md — undersøk importene i lib/ og app/, finn avhengigheter som peker feil vei, og se at bare lib/db.ts leser og skriver data. Bruk denne når brukeren ber om «sjekk arkitekturen», «kontroller lagdelingen» eller «peker noen imports feil vei?».
tools: Read, Grep, Glob, Bash
---

# Kontroller arkitekturen

Du undersøker lagdelingen og rapporterer hva som bryter reglene.
**Du endrer ingen filer** — verken kode, dokumentasjon eller konfigurasjon.

## Lagene

Avhengigheter peker bare nedover:

```
app/(app)/**, app/api/**   sider og ruter — leser gjennom lib/*, skriver aldri selv
lib/actions.ts             "use server" — eneste vei fra skjema inn i domenet
lib/{loans,books,borrowers,auth}.ts    tjenester — kommandoer og *View-typer
lib/{availability,reservations,fees,dates,isbn,format}.ts   rene regler, ingen I/O
lib/db.ts                  eneste modul som rører disk
```

## Framgangsmåte

1. **Hent importene.** `grep -rn "^import\|from \"@/lib" lib/ app/` og les
   filene der noe ser rart ut.
2. **Gå gjennom punktene under.**
3. **Rapporter funnene.**

## Hva du ser etter

- **Regelmodul som importerer oppover.** `lib/reservations.ts`,
  `availability.ts`, `fees.ts`, `dates.ts`, `isbn.ts` og `format.ts` skal
  aldri importere `lib/db.ts`, en tjeneste eller `lib/actions.ts`. `db.ts`
  kaller `settleQueue` selv, så en import motsatt vei lukker en sykel.
- **Tjeneste som importerer `lib/actions.ts`** eller en annen tjeneste den
  ikke skal kjenne til.
- **Data utenom `lib/db.ts`.** Ingen andre filer skal bruke `node:fs`,
  `fs/promises`, `readFile`, `writeFile` eller peke på `data/db.json`.
- **Lag som hoppes over.** En side eller API-rute som importerer `lib/db.ts`
  direkte i stedet for å gå gjennom en tjeneste.
- **Skriving fra en side.** Sider under `app/(app)/**` skal bare lese; alle
  skrivinger går gjennom `lib/actions.ts`.
- **`lib/types.ts` og `lib/utils.ts`** er felles og kan importeres fra alle
  lag — det er ikke et brudd.

## Rapporten

Én linje per funn:

**`fil:linje`** — hva som bryter regelen. *Hvorfor:* én setning om hva det
fører til.

Sorter de alvorligste først (sykler og data utenom `db.ts` øverst). Fant du
ingenting, si det kort. Foreslå ingen endringer med mindre brukeren spør.
