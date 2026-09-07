---
name: check-interface
description: Kontroller grensesnittekst i endrede TSX-filer under app/ og components/ — at teksten er på norsk, tydelig formulert og fri for placeholder- eller testtekst. Bruk denne etter at det er gjort endringer i grensesnittet — «sjekk grensesnittet», «kontroller teksten», «se over UI-endringene».
---

# Kontroller grensesnittet

Du leser gjennom endringene i grensesnittet og rapporterer hva som bør
forbedres. **Du endrer ingen filer** — bare når brukeren ber om det etterpå.

## Framgangsmåte

1. **Finn endringene.** `git status --short` og `git diff` (også
   `git diff --staged`). Er arbeidstreet rent, se på siste commit:
   `git diff HEAD~1`. Behold bare `.tsx`-filer under `app/` og `components/`.
   Fant du ingen, si det og stopp.
2. **Les filene.** Diffen alene viser ikke om en setning henger sammen med
   resten av skjermen — åpne hele fila når en endret linje trenger konteksten.
3. **Gå gjennom punktene under**, og noter hvert funn med fil og linjenummer.

## Hva du ser etter

**Norsk tekst.** Alt et menneske leser på skjermen skal være på norsk:
overskrifter, brødtekst, etiketter, knapper, menyvalg, lenketekst,
placeholder-tekst, tomtilstander, statusmerker, varsler, feilmeldinger og
bekreftelsesdialoger — og `aria-label`, `title` og `alt`, som hjelpemidler leser
høyt. Kode og identifikatorer er engelske og skal være det. ISBN, e-post og
liknende ord som faktisk brukes på norsk, beholdes. Reglene i sin helhet står i
`.claude/rules/norwegian-ui-text.md`.

**Tydelig og naturlig formulering.**

- Norsk setningsstil i overskrifter og knapper: «Lån ut», ikke «Lån Ut».
- « » rundt titler, mellomrom som tusenskille (`1 248`).
- Datoer og tall gjennom `lib/format.ts`, ikke satt sammen for hånd.
- Sier teksten hva som faktisk skjer? En knapp navngir handlingen, en
  tomtilstand sier hva brukeren kan gjøre nå, en beskrivelse gjentar ikke bare
  overskriften.
- Feilmeldinger har tre deler: hva som skjedde, hvilken tilstand dataene er i
  nå, og hva brukeren gjør videre.
- Oversettelser som skurrer — engelsk ordstilling med norske ord — teller også.

**Rester som ikke skal ut.** Placeholder-tekst («Lorem ipsum», «TODO», «FIXME»,
«Test», «foo», «Tittel her»), testdata som har blitt stående, halvferdige
setninger, dobbel tekst, tomme etiketter og påbegynte varianter av en tekst som
aldri ble ryddet bort.

## Rapporten

Alt i orden → si det tydelig: **kontrollen er godkjent**, og hvilke filer du
gikk gjennom.

Fant du noe → én kort linje per funn: hvor det står, hva som er galt, og hva
det bør bli. Alvorligst først. Ingen lange forklaringer, og ingen endringer før
brukeren ber om dem — avslutt med å tilby å rette opp.
