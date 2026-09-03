# Dokumentasjon

`docs/` er for større planer, spesifikasjoner og beslutninger som skal kunne
brukes på tvers av flere arbeidsøkter. Kortlevd notatarbeid hører ikke hjemme
her.

Undermapper har egne regler: [`design/`](design/CLAUDE.md) for designspråket,
[`ideas/`](ideas/CLAUDE.md) for idébanken.

## Filer

Beskrivende filnavn på norsk: `<tema>-spec.md` og `<tema>-plan.md`.

Dekker en eksisterende fil samme tema, så oppdater den i stedet for å lage en
ny. Duplikater er verre enn en fil som har vokst.

## Hva de to formene sier

- **Spec** — *hva* som skal bygges: viktige krav, valgene som er tatt, edge
  cases og den tekniske konteksten som trengs for å forstå dem.
- **Plan** — *hvordan* arbeidet skal gjennomføres.

## Hvordan de skrives

Skriv slik at en ny Claude Code-økt forstår dokumentet uten samtalehistorikken.
Ingen «som vi ble enige om», ingen «forrige forslag».

Hold det konkret og ryddig. Ikke gjenta noe som enkelt kan hentes fra kodebasen
når det trengs — filstrukturer, signaturer og navn står allerede i koden, og en
kopi her blir feil før den blir lest.
