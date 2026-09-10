# Forsiden — `/`

Forsiden er nettopp gjort om fra en tabell over katalogen til en radbasert
utstillingsflate med omslag. Dette dokumentet er neste runde: elleve ideer for å
gjøre den bedre, rangert etter hva de er verdt.

Se [`CLAUDE.md`](CLAUDE.md) for hvordan promptene er ment å brukes.

## Hva «bedre» betyr her

Forsiden har fått en ny jobb. Den gamle var en **katalog** — den svarte «hvilke
titler finnes, og hvor mange står ledig». Den nye er et **utstillingsvindu** —
den skal svare «hva skal jeg låne i dag».

Det er en annen målestokk. En katalog er god når den er fullstendig og lett å
søke i. Et utstillingsvindu er godt når det får noen til å plukke opp en bok de
ikke visste at de ville ha. Tre ting avgjør det:

1. **Det må være noe å se på.** En rad med omslag gir øyet et sted å lande som
   en tabellrad aldri gjør. Det er allerede på plass — omslagene fra Open
   Library er den største enkeltendringen i dette arbeidet.
2. **Radene må si noe personen ikke visste.** «Klar til å låne nå» sortert på
   antall ledige eksemplarer er en lagerstatus, ikke en anbefaling. En rad
   fortjener plassen sin når den avslører noe: hva andre låner, hva som er nytt,
   hva som ligner på det du likte.
3. **Det må være noe å gjøre uten å forlate siden.** Hvert klikk videre er et
   sted folk faller av. Jo mer forsiden kan svare på selv — er den ledig, kan
   jeg reservere, hva handler den om — jo lenger blir besøket.

Punkt 2 og 3 er der de fleste ideene under bor.

## Tanken bak

Radene på forsiden i dag er utledet av **beholdning** — hvor mange eksemplarer
står i hylla, hvor mange står i kø. Det er tall appen allerede hadde, og det er
grunnen til at de ble valgt.

Men beholdning er bibliotekets perspektiv, ikke låneren sitt. «Seks eksemplarer
ledige» er et driftstall. «Tre andre lånte denne i høst» er en anbefaling. Den
underliggende bevegelsen i lista under er å bytte ut _lagerstatus_ med
_menneskelig signal_ som det radene sorteres på.

Det er også grunnen til at «Populært akkurat nå» er den sterkeste raden på siden
allerede: det er den eneste som teller mennesker.

## Oversikt

| #   | Idé                                                                            | Verdi   | Jobb    | Status |
| --- | ------------------------------------------------------------------------------ | ------- | ------- | ------ |
| 1   | [Lås katalogen ut av forsiden igjen](#1-lås-katalogen-ut-av-forsiden-igjen)    | Høy     | Liten   |        |
| 2   | [Gi forsiden en åpning](#2-gi-forsiden-en-åpning)                              | Høy     | Liten   |        |
| 3   | [Vis meg noe som er mitt](#3-vis-meg-noe-som-er-mitt)                          | Høy     | Middels |        |
| 4   | [«Nytt i samlingen»](#4-nytt-i-samlingen)                                      | Høy     | Liten   |        |
| 5   | [Lån direkte fra raden](#5-lån-direkte-fra-raden)                              | Høy     | Middels |        |
| 6   | [Gjør «Populært» ærlig om tid](#6-gjør-populært-ærlig-om-tid)                  | Middels | Liten   |        |
| 7   | [Én tittel får hovedrollen](#7-én-tittel-får-hovedrollen)                      | Middels | Middels |        |
| 8   | [Bla etter forfatter og tiår](#8-bla-etter-forfatter-og-tiår)                  | Middels | Middels |        |
| 9   | [Fortell hva boken handler om](#9-fortell-hva-boken-handler-om)                | Middels | Stor    |        |
| 10  | [Gi radene noe å vise mens de laster](#10-gi-radene-noe-å-vise-mens-de-laster) | Middels | Liten   |        |
| 11  | [Rydd opp i det som ble lagt igjen](#11-rydd-opp-i-det-som-ble-lagt-igjen)     | Lav     | Liten   |        |

---

## 1. Lås katalogen ut av forsiden igjen

Alle tre radene lenker til `/boker`. Men `/boker` har ingen egen side — ruta
finnes bare som `/boker/[id]`. «Vis alle» går ingensteds, og hele den
fullstendige katalogen som forsiden pleide å være er dermed borte fra appen.

Dette er den ene tingen i arbeidet som ser ut som en ekte mangel og ikke et
valg: utstillingsvinduet erstattet katalogen i stedet for å legge seg foran den.
Det er også grunnen til at den står øverst — de fleste ideene under gjør
forsiden mer selektiv, og det er bare trygt når det finnes et sted som viser alt.

```
Forsiden er nå rader med bokomslag, og hver rad har en «Vis alle»-lenke til
/boker. Men /boker finnes ikke som egen side — bare /boker/[id]. Lenkene fører
ingensteds, og den fullstendige katalogen jeg pleide å ha på forsiden er
utilgjengelig.

Lag /boker som listen over hele samlingen — den tabellen forsiden hadde før,
med tomtilstand og det hele. Sjekk samtidig at «Bøker» i toppmenyen peker på
noe som stemmer nå som forsiden og katalogen er to forskjellige sider.
```

## 2. Gi forsiden en åpning

Siden starter i dag rett på overskriften til den første raden. Ingenting sier
hvor du er, hva stedet er, eller hva du kan gjøre her — den gamle `PageHeading`
forsvant med tabellen.

Et utstillingsvindu uten skilt over døra. Det koster lite å rette, og det er det
første et nytt menneske ser.

Det som gjør en åpning verdt plassen er at den sier noe **sant og bevegelig** —
hvor mange titler samlingen har, hvor mange eksemplarer som står ledige akkurat
nå. Da er det ikke pynt, men den korteste oppsummeringen av hele biblioteket.

```
Forsiden starter rett på den første bokraden, uten noe som sier hvor jeg er
eller hva jeg kan gjøre her.

Lag en åpning øverst på forsiden: navnet på stedet, én setning om hva jeg kan
gjøre, og et par tall som faktisk beveger seg — hvor mange titler samlingen
har og hvor mange eksemplarer som står ledige nå. Den skal være rolig og lav,
ikke en stor forside-banner, og den skal ikke gjenta det radene under uansett
sier.
```

## 3. Vis meg noe som er mitt

Forsiden ser lik ut for alle. Men appen vet hvem jeg er, hva jeg har ute, og hva
jeg står i kø for — og en reservasjon som er klar til henting er den mest
tidskritiske beskjeden hele systemet har. I dag må jeg til «Mine lån» for å se
den.

En rad som svarer «dette gjelder deg» er det enkleste som finnes for å få noen
til å komme tilbake til en forside. Den skal stå øverst når den har noe å si, og
være helt borte når den ikke har det.

```
Forsiden ser lik ut uansett hvem som er logget inn, selv om appen vet hva jeg
har ute og hva jeg står i kø for.

Legg en personlig rad øverst på forsiden for den som er logget inn: bøker jeg
har ute nå, og reservasjoner som er klare til henting. Har jeg noe som
forfaller snart eller er forfalt, skal det være tydelig. Har jeg ingenting ute,
skal raden ikke vises i det hele tatt — ikke en tom boks. Er jeg ikke logget
inn, skal forsiden være som før.
```

## 4. «Nytt i samlingen»

Tre rader, og ingen av dem svarer «hva er nytt». Det er spørsmålet en gjenganger
kommer tilbake for å få svar på — og den eneste grunnen til å besøke forsiden på
nytt om en uke. Slik den er nå, ser den lik ut hver gang inntil noen leverer en
bok.

Utgivelsesåret finnes allerede på hver bok. Det er ikke det samme som når
biblioteket kjøpte den inn, men det er nære nok til å gi en ærlig rad, og det
koster ingen endring i datamodellen.

```
Forsiden sier hva som er ledig, hva som er populært og hva det er kø på — men
ingenting om hva som er nytt. Det er det jeg kommer tilbake for å se.

Legg til en rad «Nytt i samlingen» med de nyeste titlene. Vær ærlig om hva
«nyest» betyr med de opplysningene appen har, og skriv det i beskrivelsen til
raden. Legg raden der den gir mest mening i rekkefølgen, ikke nødvendigvis
nederst.
```

## 5. Lån direkte fra raden

Et kort på forsiden sier «Tilgjengelig», men for å faktisk låne må jeg klikke
inn på tittelen, lese detaljsiden og finne knappen der. Tre steg for noe jeg
allerede har bestemt meg for.

Det samme gjelder «Verdt å vente på»: raden forteller meg at det er kø, og
beskrivelsen ber meg reservere — men den eneste veien til reservasjonen går
gjennom en annen side.

Dette er den enkeltendringen som mest direkte gjør forsiden om fra noe du leser
til noe du bruker.

```
På forsiden ser jeg at en bok er tilgjengelig, men jeg må klikke meg inn på
tittelen for å låne den. På raden «Verdt å vente på» får jeg beskjed om å
reservere, men kan ikke gjøre det derfra.

La meg låne en ledig bok og reservere en utlånt bok rett fra kortet på
forsiden. Etterpå skal jeg bli værende på forsiden og se at det ble gjort — og
kortet skal vise den nye tilstanden. Feiler det, skal jeg få vite hva som
skjedde og hva boken er i nå. En som ikke er logget inn skal få vite at det er
derfor det ikke går.
```

## 6. Gjør «Populært» ærlig om tid

Raden heter «Populært akkurat nå», men teller hele utlånshistorikken. En bok som
ble lånt ti ganger i 2024 og aldri siden slår en som har vært lånt fire ganger i
høst. «Akkurat nå» er da ikke sant.

Det er to veier ut: rett navnet så det stemmer med tallet, eller rett tallet så
det stemmer med navnet. Den andre er mer verdt — en rad som beveger seg måned
for måned er en grunn til å komme tilbake, mens en historisk topplista ser lik
ut for alltid.

```
Raden «Populært akkurat nå» på forsiden teller hele utlånshistorikken, så
innholdet står stille selv om ingen har lånt en av titlene på et år.
«Akkurat nå» er ikke sant.

Gjør populariteten tidsavgrenset, slik at raden faktisk beveger seg gjennom
året, og la beskrivelsen si hvilken periode den snakker om. Har for få titler
lån i perioden til å fylle en rad, skal raden håndtere det pent i stedet for å
vise to kort.
```

## 7. Én tittel får hovedrollen

Alle kortene er like store, så alt veier likt, og øyet får ikke noe å feste seg
ved. Et utstillingsvindu har alltid én ting foran.

Det finnes et ferdig valg: den mest lånte tittelen i samlingen. Gitt et stort
omslag, forfatter, år og en låneknapp blir den en åpning som gjør en jobb i
stedet for å bare pynte — og den henger sammen med idé 2, som er den rolige
versjonen av det samme.

```
Alle bokkortene på forsiden er like store, så ingenting trekker blikket, og
siden leses som tre like lange lister.

Løft én tittel fram øverst — den mest lånte i samlingen — i et større format
med omslaget stort, forfatter, år og status, og en tydelig handling. Den skal
bruke det samme designspråket som resten av appen, ikke bli en fremmed
forside-banner. Har samlingen for lite utlånshistorikk til at valget er
meningsfullt, skal siden klare seg uten den.
```

## 8. Bla etter forfatter og tiår

Er du ikke ute etter en bestemt bok, har forsiden akkurat tre veier å tilby, og
når du har sett dem er du tom. Søkefeltet krever at du vet hva du leter etter.

Sjanger finnes ikke i datamodellen, men **forfatter** og **utgivelsesår** gjør
det. Begge er nok til å gi en flate å bla på — og en forfatter med flere titler
i samlingen er et helt naturlig neste klikk fra en bok du nettopp likte.

```
Er jeg ikke ute etter noe bestemt, har forsiden bare tre rader å tilby, og så
er jeg tom. Søket krever at jeg vet hva jeg leter etter.

Gi meg en måte å bla på uten et søkeord, bygget på det appen faktisk vet om
bøkene — forfatter og utgivelsesår. Det skal føre meg videre til noe, ikke bare
være merkelapper å se på. Ta det så langt det er dekning for i dataene, og ikke
finn på kategorier som ikke finnes.
```

## 9. Fortell hva boken handler om

Et kort viser omslag, tittel, forfatter, år og status. Ingenting om hva boken
_er_. Skal noen plukke opp en tittel de ikke kjenner, er det den opplysningen
som mangler mest — og uten den er omslaget alene om å selge boken.

Omslagene kommer allerede fra Open Library, og samme sted har korte beskrivelser
og emneord for de fleste ISBN-er. Men dette er stor jobb sammenlignet med resten
av lista: det er første gang appen ville hentet noe over nett som _ikke_ er et
bilde nettleseren kan be om selv, og det bryter med at `lib/covers.ts` er en ren
regel uten I/O. Verdt å ta som et eget stykke arbeid, ikke som et påheng.

```
Bokkortene og bokdetaljsiden viser omslag, tittel, forfatter, år og status,
men ingenting om hva boken handler om. Skal jeg plukke opp en tittel jeg ikke
kjenner, er det nettopp det jeg mangler.

Hent en kort beskrivelse av boken fra Open Library og vis den der den hjelper
mest. Appen skal fungere nøyaktig som før når tjenesten er nede, treg eller
ikke har noe å si om en ISBN — en manglende beskrivelse er en normal tilstand,
ikke en feil. Pass på at dette ikke gjør sidene tregere å laste, og hold det
utenfor regelmodulene som i dag verken leser disk eller nett.
```

## 10. Gi radene noe å vise mens de laster

Forsiden er `force-dynamic` og henter datasettene sine før noe som helst tegnes,
og omslagene kommer fra en tjeneste utenfor appen. På en treg linje er første
inntrykk en tom side.

Designspråket har allerede skjelett-tilstander, og en tom rad forsvinner i dag
uten et ord. Å dekke lastetilstanden er lite arbeid og synes hver eneste gang.

```
Forsiden henter alle dataene før den tegner noe, og omslagene kommer fra en
tjeneste utenfor appen. På en treg linje er det første jeg ser en tom side.

Gi forsiden en lastetilstand som viser formen på radene mens de kommer, i tråd
med skjelett-mønsteret i designspråket. Sørg samtidig for at et enkelt
bokomslag som er tregt eller mangler ikke lar et hull stå igjen i raden.
```

## 11. Rydd opp i det som ble lagt igjen

Småting fra dette arbeidet som ikke rekker en egen idé, men som blir vanskeligere
å rette jo lenger de får ligge.

Den viktigste: `components/ui/carousel.tsx` henter `cn` fra npm-pakken `cn`,
mens de sytten andre filene i `components/ui/` bruker `@/lib/utils`. Pakken ble
lagt inn i `package.json` for å få importen til å løse seg. To
klassenavn-sammenslåere i samme mappe er én for mye, og den nye er den eneste
som avviker.

```
Rydd opp etter arbeidet med forsiden:

- components/ui/carousel.tsx importerer `cn` fra npm-pakken «cn», mens resten
  av components/ui/ bruker @/lib/utils. Gjør den lik de andre og fjern
  avhengigheten hvis ingenting annet trenger den.
- listBooksByPopularity leser lånene én gang selv og én gang til gjennom
  listBooks. Se om det er verdt å rette.
- Forsidens `metadata.description` beskriver fortsatt utlånssystemet, ikke det
  siden nå faktisk viser.

Kjør lint og tester etterpå.
```

## Flere ideer, kortere

```
Radene på forsiden viser seks titler hver, og «Vis alle» går til den samme
siden for alle tre. La hver «Vis alle» føre til den listen raden faktisk
handler om, ikke bare til hele katalogen.
```

```
En rad uten titler forsvinner helt fra forsiden uten et ord. Vurder om minst
én av radene heller bør si fra at den er tom — en forside som stille krymper
til to rader forklarer ingenting for den som lurer.
```

```
På forsiden er hele bokkortet én lenke til tittelen. Sjekk at kortet er
hyggelig å bruke med tastatur alene — at fokus er synlig, at karusellen ikke
hopper, og at pilene og prikkene er beskrevet for skjermleser.
```

```
Forsiden er force-dynamic og bygger listene sine av hele katalogen ved hvert
besøk. Se på om noe av det kan mellomlagres uten at ledig-tallene blir
feilaktige.
```

```
Bokkortet på forsiden viser «3 av 5» ved siden av statusmerket. Vurder om det
tallet sier låneren noe, eller om det er et driftstall som hører hjemme i
katalogen og i administrasjonen.
```
