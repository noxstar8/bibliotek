---
name: add-idea
description: Legg en ny idé inn i idébanken under docs/ideas/. Bruk denne når brukeren beskriver en forbedring som ikke skal bygges nå, men skrives ned — «legg til en idé», «noter dette som en idé», «dette bør inn i idébanken».
---

# Legg til en idé i idébanken

Brukeren gir en kort idé. Du skriver den ned i `docs/ideas/` i samme form som
ideene som allerede står der. Du bygger den ikke.

**Alt du skriver i idébanken er på norsk.** Hver fil under `docs/ideas/`, i sin
helhet: overskrifter, brødtekst, tabellrader, seksjonstitler og selve promptene.
Det gjelder også en fil du oppretter selv. Bare filnavnet er engelsk, og
kodeidentifikatorer og ruter beholder navnene sine — ellers skal ingen engelsk
tekst inn i banken. Skriver brukeren ideen sin på engelsk, oversetter du den.

## Framgangsmåte

1. **Les reglene først.** `docs/ideas/CLAUDE.md` sier hva formatet er og hvordan
   nye ideer legges til. Den er fasit — dette dokumentet er bare rekkefølgen.
2. **Finn riktig fil.** `ls docs/ideas/` og se på oversiktstabellen i
   `docs/ideas/CLAUDE.md`. Hører ideen til en skjerm eller et område som
   allerede har en fil, skal den inn der. Bare når den ikke passer noen av dem,
   lag en ny fil — engelsk filnavn, alt innholdet på norsk — og følg formen i
   en eksisterende fil (`borrower-card.md` er malen).
3. **Vurder ideen mot koden.** Slå opp skjermen eller modulen ideen gjelder før
   du skriver. En idé i denne banken er veid mot hvordan appen faktisk er i dag;
   sjekk også at den ikke allerede står der i en annen form.
4. **Skriv den.** En egen seksjon når ideen trenger en begrunnelse: noen
   setninger om *hvorfor*, så selve prompten i en kodeblokk. Bærer den ikke det,
   legg den som en énlinjes prompt under «Flere ideer, kortere» nederst.
5. **Oppdater oversiktene.** Ny seksjon → ny rad i oversiktstabellen øverst i
   fila, med verdi og arbeidsmengde, plassert etter rangering. Ny fil → ny rad i
   tabellen i `docs/ideas/CLAUDE.md`.

## Slik skal prompten være

- **Norsk**, skrevet til Claude Code, klar til å kopieres rett inn.
- Beskriv **opplevelsen**, ikke løsningen. Nevn ingen filer, funksjoner eller
  komponenter — de leses uansett automatisk, og en prompt som foreskriver
  implementasjonen låser den til slik koden så ut den dagen.
  Ruter (`/admin/brukere/[id]`) er greit: de sier *hvor*, ikke *hvordan*.
- Si hva som er situasjonen i dag, hva som skal være mulig, og hvor brukeren
  skal stå etterpå.

## Til slutt

Vis brukeren hvor ideen havnet og hva du skrev. Ikke bygg den, og ikke rør
annen kode.
