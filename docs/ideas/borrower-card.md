# Lånekortet — `/admin/brukere/[id]`

Ti forbedringer av siden som viser én bruker, rangert etter hvor mye de er verdt.
Se [`README.md`](README.md) for hvordan promptene er ment å brukes.

## Tanken bak

Siden er i dag en **rapport**. Men det er nøyaktig skjermen en bibliotekar står
på når personen står foran dem i skranken. Alt som skjer i den samtalen — «her
er bøkene mine», «kan jeg låne denne?», «jeg vil hente den reserverte» — må i
dag gjøres et helt annet sted.

Å gjøre kortet om fra noe du *leser* til noe du *jobber i* er den ene tanken de
fleste ideene under er varianter av.

## Oversikt

| # | Idé | Verdi | Jobb | Status |
| --- | --- | --- | --- | --- |
| 1 | [Gjør låneren klikkbar overalt](#1-gjør-låneren-klikkbar-overalt) | Høy | Liten | **Gjort** |
| 2 | [Lever inn bøker fra kortet](#2-lever-inn-bøker-fra-kortet) | Høy | Liten | |
| 3 | [Håndter reservasjonene fra kortet](#3-håndter-reservasjonene-fra-kortet) | Høy | Liten | |
| 4 | [Lån ut til personen i skranken](#4-lån-ut-til-personen-i-skranken) | Høy | Middels | |
| 5 | [Se appen som denne personen](#5-se-appen-som-denne-personen) | Middels | Liten | |
| 6 | [Si fra om det forfalte med én gang](#6-si-fra-om-det-forfalte-med-én-gang) | Middels | Liten | |
| 7 | [Forleng et lån](#7-forleng-et-lån) | Middels | Middels | |
| 8 | [Rett navn og e-post](#8-rett-navn-og-e-post) | Middels | Middels | |
| 9 | [Fortell hvem personen er over tid](#9-fortell-hvem-personen-er-over-tid) | Middels | Liten | |
| 10 | [Slett en person](#10-slett-en-person) | Lav | Middels | |

---

## 1. Gjør låneren klikkbar overalt

> **Gjort.** Navnet i lånelistene på `/admin` og `/admin/reservasjoner` lenker nå
> til lånekortet.

Du kom fra brukerlista til lånekortet, men ikke fra en lånerad. Sto du i lista
over aktive lån og lurte på hvem en person var, fantes det ingen vei dit. Et
lånekort ingen finner er like godt som intet lånekort.

```
På /admin og /admin/reservasjoner står navnet på låneren i hver rad, men det
er ikke klikkbart. Gjør navnet til en lenke til lånekortet til den personen,
slik at jeg kommer rett dit fra en lånerad. Navnet skal se ut og oppføre seg
som de andre klikkbare navnene i appen.
```

## 2. Lever inn bøker fra kortet

Ser du en forfalt bok på kortet, må du i dag gå til lista over aktive lån og
finne raden igjen for å gjøre noe med den. Den korteste veien fra «siden viser
meg et problem» til «siden lar meg løse det».

```
På lånekortet /admin/brukere/[id] ser jeg hvilke bøker personen har ute, men
jeg kan ikke levere dem inn derfra — jeg må gå til /admin og finne raden igjen.

Legg til en handling på hver rad under «Bøker ute nå» som registrerer at boken
er levert. Etterpå skal jeg bli værende på lånekortet og få bekreftelsen der,
ikke bli sendt til en annen side.
```

## 3. Håndter reservasjonene fra kortet

Kortet forteller at personen har en bok klar til henting, men gir deg ingen måte
å levere den ut på. Personen står foran deg.

```
Lånekortet /admin/brukere/[id] viser at personen har reservasjoner, og at noen
av dem er klare til henting — men jeg kan ikke gjøre noe med dem derfra.

Legg til handlinger på hver reservasjonsrad: levere ut boken, og slette
reservasjonen. Utlevering skal bare tilbys når det faktisk står et eksemplar
klart. Sletting må bekreftes først, og forklare at personen mister plassen i
køen. Etter begge deler skal jeg bli værende på lånekortet.
```

## 4. Lån ut til personen i skranken

Den mest åpenbart manglende funksjonen. I dag kan en bibliotekar bare låne bøker
til seg selv — tomteksten på kortet lover til og med «lån som registreres i
skranken dukker opp her», om en flyt som ikke finnes.

```
I dag kan en bibliotekar bare låne bøker til seg selv: trykker jeg «Lån boken»
blir lånet registrert på meg, ikke på personen som står i skranken.

Gjør det mulig å låne ut en bok til personen jeg har åpnet lånekortet til. Jeg
vil kunne finne fram til en tittel, se om den er ledig, og registrere lånet på
personen. Boken skal så dukke opp under «Bøker ute nå» på samme side, og jeg
skal bli værende der.
```

## 5. Se appen som denne personen

Nyttig når noen spør hva de selv ser på skjermen sin — og det gjør demoens hele
poeng, å gå mellom rollene, til noe du kan gjøre fra der du står.

```
Legg til en måte å bytte til denne personen på fra lånekortet
/admin/brukere/[id], slik at jeg ser appen slik de ser den.

Det skal være tydelig at jeg faktisk bytter bruker og ikke bare forhåndsviser
noe, og det skal være lett å finne veien tilbake.
```

## 6. Si fra om det forfalte med én gang

Har personen forfalte bøker, er det den samtalen som skal skje. I dag er tallet
begravd som ett av tre i oppsummeringen.

```
På lånekortet /admin/brukere/[id] er antall forsinkede bøker bare ett av tre
tall i oppsummeringen øverst. Har personen noe forfalt, er det det viktigste
på hele siden.

Løft det fram som en tydelig melding øverst som sier hvor mange bøker som er
forsinket og hvor mye personen skylder, slik at jeg ser det i det sekundet jeg
åpner kortet. Har personen ingenting forfalt, skal meldingen ikke være der.
```

## 7. Forleng et lån

Det vanligste ønsket en låner har, og det finnes ikke i appen i dag.

```
Legg til mulighet for å forlenge et lån fra lånekortet /admin/brukere/[id],
slik at fristen settes 28 dager fram fra i dag.

Et lån skal ikke kunne forlenges hvis noen står i kø for den boken — da skal
raden si hvorfor i stedet for å tilby en knapp som blir avvist. Etterpå skal
jeg bli værende på lånekortet.
```

## 8. Rett navn og e-post

Du kan endre hva en person *har lov til*, men ikke rette en skrivefeil i navnet
deres. Bøker kan redigeres fullt ut; personer kan ikke.

```
På lånekortet /admin/brukere/[id] kan jeg endre rollen til en person, men ikke
rette et feilstavet navn eller en feil e-postadresse.

Legg til redigering av navn og e-post. To personer skal ikke kunne ha samme
e-postadresse, og prøver jeg det skal jeg få vite det uten å miste det jeg har
skrevet.
```

## 9. Fortell hvem personen er over tid

«Forsinket nå: 1» sier hva som gjelder i dag. Det sier ingenting om forskjellen
på en som er sen akkurat nå og en som alltid er sen.

```
Oppsummeringen øverst på lånekortet /admin/brukere/[id] viser lån totalt,
forsinket nå og utestående gebyr. Gjør den mer nyttig ved å også si noe om
hvem personen er over tid — for eksempel hvor stor andel av lånene som er
levert i tide, og når de lånte første og siste gang.

I tabellen «Bøker ute nå» vil jeg i tillegg se hvor lenge personen har hatt
hver enkelt bok.
```

## 10. Slett en person

Fullfører symmetrien mot bøker, som allerede kan slettes. Lavest verdi — et
bibliotek sletter sjelden folk — men asymmetrien er påfallende.

```
Bokdetaljsiden har en sone nederst for å slette boken. Lånekortet
/admin/brukere/[id] har ingenting tilsvarende.

Legg til mulighet for å slette en person fra registeret. Det skal ikke være
mulig hvis personen har bøker ute, eller hvis det er den siste bibliotekaren
igjen — da skal siden si hvorfor i stedet for å tilby en knapp som feiler.
Selve slettingen må bekreftes, og bekreftelsen skal si hva som forsvinner og
hva som blir stående.
```

---

## Flere ideer, kortere

Ikke forkastet, men de bærer mindre enn de ti over. Hver linje kan brukes som en
prompt som den er.

```
Legg til piler for neste og forrige låner på lånekortet, så jeg kan bla meg
gjennom registeret uten å gå via lista.
```

```
Gjør det mulig å reservere en bok på vegne av personen jeg har åpnet
lånekortet til, på samme måte som jeg kan låne ut til dem.
```

```
La en bibliotekar ettergi gebyret på et enkelt lån fra lånekortet, slik at
«utestående gebyr» blir et tall som faktisk kan gjøres opp.
```

```
Legg til en måte å merke en bok som tapt på. Et lån som har vært ute i et
halvår kommer ikke tilbake, og binder i dag et eksemplar for alltid.
```

```
La bibliotekarer skrive et kort notat på en person — «har mistet lånekortet»,
«ringer alltid om forsinkelser» — som vises på lånekortet.
```

```
Legg til en knapp for å kopiere e-postadressen til personen på lånekortet.
```

```
Legg til filtrering på lånehistorikken på lånekortet: alle, bare forsinkede,
bare leverte.
```

```
Grupper lånehistorikken på lånekortet etter år. 50 rader i én strøm er en
logg; delt på år er det en fortelling.
```

```
Vis lånemønsteret til personen som et lite diagram på lånekortet — for
eksempel hvor mange bøker de har lånt per måned.
```

```
Marker i lånehistorikken når personen har lånt samme tittel flere ganger.
```

```
I lånehistorikken står «Ukjent tittel» når boken er slettet fra katalogen.
Skriv heller at boken er slettet, siden det er noe annet enn at den aldri
fantes.
```

```
Rollekortet ligger nederst på lånekortet, under tre tabeller. Legg til en
snarvei til det fra oppsummeringen øverst.
```

```
Lånehistorikken på lånekortet viser alle lån på én gang. Legg til en
«Vis alle»-knapp og vis bare de nyeste til å begynne med.
```
