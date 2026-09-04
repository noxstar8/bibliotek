# Ideer

Forbedringer som er vurdert mot koden, men ikke bygget ennå. En ryddeplass
mellom «det burde noen gjort noe med» og en faktisk oppgave.

Hver idé er skrevet som en **ferdig prompt du kan kopiere rett inn i Claude
Code**. Det er hele poenget med formatet: en idé som må formuleres på nytt hver
gang den tas opp, blir ikke tatt opp.

## Områder

| Fil | Handler om | Status |
| --- | --- | --- |
| [`borrower-card.md`](borrower-card.md) | Lånekortet — `/admin/brukere/[id]` | 1 av 10 gjort |
| [`book-page.md`](book-page.md) | Bokdetaljsiden — `/boker/[id]` | 0 av 1 gjort |

## Slik bruker du dem

1. Finn området i tabellen over.
2. Les den korte begrunnelsen for ideen — den sier *hvorfor* den er verdt noe.
3. Kopier prompten under den inn i Claude Code.
4. Kryss av i statuskolonnen i den fila når den er bygget.

Promptene sier bevisst ingenting om filer, funksjoner eller komponenter. De
beskriver **opplevelsen**, ikke løsningen — `CLAUDE.md` og
[designspråket](../design/CLAUDE.md) leses uansett automatisk, og en prompt som
foreskriver implementasjonen låser den til slik koden så ut den dagen ideen ble
skrevet.

## Slik legger du til nye

Én fil per skjerm eller område, oppkalt på engelsk som resten av kodebasen, med
norsk innhold. Følg formen i `borrower-card.md`:

- **Tanken bak** — den ene observasjonen ideene er varianter av. Uten den blir
  lista en ønskeliste, ikke en retning.
- **En rangert oversiktstabell** med verdi og arbeidsmengde, så det er mulig å
  plukke uten å lese alt.
- **Én seksjon per idé** — noen setninger om hvorfor, så prompten i en
  kodeblokk.
- **«Flere ideer, kortere»** nederst for de som ikke bar nok til en egen
  seksjon, som énlinjes prompter.

Legg så en rad i tabellen over.

Ideer som er bygget slettes ikke med én gang — de merkes som gjort. Det er
nyttig å se hva som er prøvd, og en idé som ble bygget halvveis kommer ofte
tilbake.
