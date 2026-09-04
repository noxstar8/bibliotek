---
description: All tekst brukeren ser i grensesnittet skal være på norsk
globs: ["app/**/*.tsx", "components/**/*.tsx"]
---

# Norsk grensesnittekst

All tekst brukeren ser i grensesnittet skal være på **norsk**. Kode og
identifikatorer — variabel-, funksjons-, komponent- og propnavn, typer,
kommentarer i koden — forblir på **engelsk**.

Dette gjelder alt som blir lest av et menneske på skjermen:

- Overskrifter, brødtekst, etiketter og hjelpetekster
- Knapper, menyvalg, navigasjon og lenketekst
- Placeholder-tekst, tomtilstander, statusmerker og varsler
- Feilmeldinger og bekreftelsesdialoger
- `aria-label`, `title`, `alt` og annen tekst hjelpemidler leser opp

## Skrivemåte

- Norsk setningsstil i overskrifter og knapper: «Lån ut», ikke «Lån Ut».
- Bruk « » som anførselstegn rundt titler.
- Tall skrives med mellomrom som tusenskille: `1 248`.
- Datoer og tall formateres gjennom `lib/format.ts` (`nb-NO`), ikke ad hoc.

## Unntak

Ord som faktisk brukes på norsk i denne sammenhengen — ISBN, e-post — beholdes
som de er. Ellers skal ingen engelsk tekst nå skjermen.
