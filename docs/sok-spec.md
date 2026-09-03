# Globalt søk — spesifikasjon

Ett søkefelt i headeren, og én søkeside som viser treff på tvers av bøker,
personer, lån og reservasjoner. Det finnes ikke søk i appen i dag: hver liste
viser alt den har, og eneste veien til en post er å bla i den lista den står i.

Dokumentet sier *hva* som skal bygges. Det forutsetter [`CLAUDE.md`](../CLAUDE.md)
og [designspråket](design/CLAUDE.md), og gjentar ikke reglene derfra.

---

## Kjernevalget

Søket er **ett spørsmål stilt til hele datagrunnlaget, filtrert av hvem du er**.
Ikke fire søk med hver sin fane, og ikke ett søk som bare finner bøker.

Grunnen er at de fire tingene appen holder på med er én sak sett fra fire
kanter: en bibliotekar som skriver «Kari» vil se personen *og* det hun har ute,
og en som skriver «Sult» vil se tittelen *og* hvem som har den. Å tvinge dem til
å velge kategori først er å be dem svare på spørsmålet de kom for å stille.

Søket kjører i minnet over hele `Database`. Datagrunnlaget er en JSON-fil med
titler i titallsklassen — indeks, rangeringsmodell eller ekstern søkemotor ville
være maskineri uten last, og hele poenget med `lib/db.ts` er at det ikke finnes
noen database å spørre.

---

## Hva som er søkbart

Fire posttyper. Kolonnen «felt» er *alt* som matches — ingenting utenfor lista
teller som treff.

| Posttype | Felt det søkes i | Hva en rad lenker til |
| --- | --- | --- |
| Bok | tittel, forfatter, ISBN, utgivelsesår | `/boker/[id]`, eller `/admin/boker/[id]` for bibliotekar |
| Person | navn, e-post | `/admin/brukere/[id]` |
| Lån | boktittel, forfatter, ISBN, lånerens navn og e-post | `/admin/brukere/[id]` — lånekortet lånet står på |
| Reservasjon | samme som lån | `/admin/reservasjoner` |

Merk hva som **ikke** er søkbart, og hvorfor:

- **Ider** (`bok-…`, `laaner-…`, `loan-…`). De er uuid-er ingen skriver av hånd.
- **Datoer og statuser.** «forfalt» og «klar til henting» er avledede ord som
  ikke står i noe felt, og å oversette dem til filtre er et annet produkt — se
  «Utenfor spesifikasjonen».
- **Gebyrbeløp.** Samme grunn: avledet, ikke lagret.

Lån og reservasjoner har ingen egne tekstfelt i det hele tatt — de er søkbare
*gjennom* boken og personen de knytter sammen. Det er også hele verdien deres i
et søk: «Kari» skal finne lånet hennes, ikke bare henne.

---

## Hvem som ser hva

Dette er den harde regelen i spesifikasjonen. Filtreringen skjer i
tjenestelaget, ikke i visningen — en søkeside som henter alt og skjuler det
meste er en lekkasje som venter på å skje.

| Posttype | Ikke innlogget | Låner | Bibliotekar |
| --- | --- | --- | --- |
| Bok | ja | ja | ja |
| Person | nei | **bare seg selv** | ja, alle |
| Lån | nei | bare sine egne | ja, alle |
| Reservasjon | nei | bare sine egne | ja, alle |

En låner skal ikke kunne søke opp andre folk. Katalogen er offentlig — den står
allerede åpen på `/` — men hvem som har lånt hva er det ikke, og et søkefelt som
svarer på «hvem heter Kari» ville gjort hele brukerregisteret lesbart for alle
med en konto.

At låneren finner **seg selv** er med vilje: navnet sitt er det første folk
prøver, og et søk som later som personen ikke finnes er verre enn ett som viser
henne det ene kortet hun har lov til å se. Det lekker ingenting — hun er den
eneste som får det treffet.

Rader en person ikke har lov til å se skal ikke telles heller. Antallet i
overskriften er antallet *denne* leseren fikk; ellers forteller tallet at det
finnes noe hun ikke får se.

Ikke innlogget er søket katalogsøk og ingenting annet. Feltet står i headeren og
virker; treff på personer, lån og reservasjoner finnes bare ikke.

---

## Hvor smart søket skal være

Én modell, brukt likt på alle felt: **normaliser, del i ord, krev at alle ordene
finnes et sted i posten.**

### Normalisering

Før sammenligning kjøres både søket og feltet gjennom:

1. `normalize("NFC")` — se avsnittet om æ ø å under.
2. `toLocaleLowerCase("nb-NO")` — søk er ikke versalfølsomt.
3. Trimming, og indre mellomrom slått sammen til ett.

### Æ, ø og å

Bokstavene sammenlignes **som seg selv**, ikke foldet til ae/oe/aa. «Sult» og
«sult» er samme ord; «Håkon» skrevet «Hakon» er ikke et treff.

Grunnen er at foldingen koster mer enn den gir her: bokstavene ligger på
tastaturet til alle som bruker appen, og en folding som gjør «hakon» til et
treff på «Håkon» gjør også «sa» til et treff på «så».

`normalize("NFC")` er noe annet, og den gjør vi: en «å» skrevet som a + ring
skal matche en «å» skrevet som ett tegn. Det er samme bokstav, ikke en annen
stavemåte, og forskjellen er usynlig for den som skrev den — den kommer fra
tastaturoppsettet eller en utklippstavle, ikke fra en avgjørelse.

### Delord

Delordstreff, forankret hvor som helst i feltet: `felt.includes(ord)`.

«sult» skal finne «Sult», og «potter» skal finne «Harry Potter». Prefiksmatch
alene ville tvunget folk til å kunne den første halvdelen av tittelen for å
finne den andre, og det er ikke slik folk husker bøker.

Ordet må være minst **to tegn**. Ett tegn matcher nesten alt og gjør
resultatlista til støy.

### Flere ord

Søket deles på mellomrom, og **alle** ordene må treffe posten. Hvert ord kan
treffe i hvert sitt felt: «rowling harry» finner Harry Potter fordi «rowling»
treffer forfatteren og «harry» treffer tittelen. Rekkefølgen betyr ingenting.

OG, ikke ELLER: flere ord er måten folk snevrer inn på, og en ELLER-modell ville
gitt *flere* treff jo mer presist man skriver.

### ISBN

Sammenlignes med sifrene, ikke med tegnene. Både søket og feltet kjøres gjennom
`normalizeIsbn` fra [`lib/isbn.ts`](../lib/isbn.ts) før sammenligningen, slik at
`9780747532699`, `978-0-7475-3269-9` og `978 0 7475 3269 9` finner samme bok.
Delordstreff gjelder også her — de fire siste sifrene er nok når man sitter med
boka i hånda.

Regelen slår bare inn når ordet **ser ut som** et ISBN-fragment: minst fire tegn
som bare er siffer, bindestrek, mellomrom eller `X`. Ellers ville et ord som
«1984» blitt sammenlignet mot alle ISBN-ene i katalogen, og «1984» er en tittel.
Årstall matches uansett som vanlig tekst mot `year`, så «1984» finner Orwell på
både tittel og år — det er samme bok, så det blir én rad.

Et søk som er *bare* et ISBN skal derfor lande på nøyaktig én bok. Det er
tilfellet feltet i skranken finnes for.

### Rangering

Treffene sorteres i denne rekkefølgen, uten poengsum:

1. **Posttype**, i fast orden: bøker, personer, lån, reservasjoner. Boken er det
   folk søker etter oftest, og fast orden gjør at samme søk ser likt ut hver
   gang.
2. **Treffkvalitet** innen typen: hele feltet er søket (`===`) før feltet
   begynner med søket før delordstreff.
3. **Alfabetisk** på navnet raden viser, `localeCompare("nb-NO")`.

En ekte relevansmodell er feil verktøy for et datagrunnlag i denne størrelsen.
Med et par titalls treff er forutsigbar orden mer verdt enn smart orden.

### Tak

Maks **50 rader**, og teksten sier fra når taket slår inn: «Viser de 50 første
av 63 treff. Skriv mer for å snevre inn.» Et søk med hundrevis av treff er ikke
et svar uansett, og det er billigere å be om et bedre søk enn å tegne lista.

---

## Skjermene

### Søkefeltet i headeren

Et `InputGroup` med `Search01Icon` som ledende addon, plassert mellom
wordmarken og navigasjonen. Det er et vanlig `<form method="get" action="/sok">`
med `name="q"` — ingen live-søk mens man skriver, ingen debounce, ingen
klientstate. Enter går til søkesiden.

Grunnen er at hele appen er serverkomponenter som leser gjennom `lib/*`, og et
søkefelt som henter mens man skriver ville vært det første stedet som brøt med
det. Et GET-skjema gir tilbake-knappen, delbare lenker og bokmerker gratis.

Feltet fyller `q` med det som ble søkt etter når man står på `/sok`, slik at
søket kan justeres i stedet for å skrives på nytt.

Plassholderen er rollestyrt — «Søk i katalogen» for en låner, «Søk i bøker, folk
og lån» for en bibliotekar — så feltet ikke lover mer enn det leverer.

På smal skjerm står feltet på sin egen linje under wordmarken. Headeren har
`flex-wrap` fra før; feltet skal ikke skyve navigasjonen ut.

### Søkesiden — `/sok`

En serverkomponent som leser `?q=`. `export const dynamic = "force-dynamic"`,
som resten av appen.

- `PageHeading` med tittelen **Søk**. Ingressen sier hva som er søkbart *for
  denne leseren* — en låner får ikke lovnad om folk og lån.
- Ett `Card` per posttype som har treff, i rangeringsrekkefølgen over. Kort for
  typer uten treff vises ikke i det hele tatt — et tomt kort er støy.
- Hvert kort: `CardTitle` med typenavnet, `CardDescription` med antallet («3 av
  12 titler»), og en `Table` i `CardContent className="px-0"` etter
  tabellreglene i designspråket — identitetskolonne med ikonflis,
  `IDENTITY_CELL`, og radhandlinger i én overflow-meny.
- Radene skal se ut som de samme postene gjør ellers i appen. En bokrad på
  søkesiden er den samme raden som på `/`, med tilgjengelighet og status; en
  lånerad er den samme som på `/admin`, med frist og status. Søk er en annen vei
  inn til de samme postene, ikke en annen framstilling av dem.

`metadata.title` er «Søk – Bibliotek». Siden ligger på toppnivå, ved siden av
`/` og ikke under den, så den har verken breadcrumbs eller `AdminNav`.

---

## Grensetilfellene

De fire tilstandene siden må ta stilling til. De tre første er
`Empty`-komponenten med `className="border bg-card"`.

### Tomt søk — `/sok` uten `q`, eller `q` som bare er mellomrom

Ikke en feil. Siden viser en `Empty` med `Search01Icon`, tittelen «Hva leter du
etter?» og en beskrivelse som sier hva som kan søkes i, rollestyrt på samme måte
som plassholderen. Ingen tabeller, ingen «0 treff» — ingenting er søkt etter, så
ingenting er funnet.

Feltet i headeren er handlingen; siden legger ikke til en knapp som bare peker
tilbake på det.

### For kort søk — ett enkelt tegn

Samme tilstand som tomt søk, men med sin egen beskrivelse: «Skriv minst to
tegn.» Å behandle det som null treff ville sagt at søket ble kjørt og ikke fant
noe, og det er ikke det som skjedde.

### Null treff

`Empty` med tittelen **Ingen treff på «{q}»** — søkeordet gjentas i
« »-anførsel, slik appen ellers siterer poster, så det er tydelig hva som ble
søkt etter. Beskrivelsen sier hva som kan være galt og hva man gjør nå:
stavemåten, færre ord, og at søket bare dekker det denne leseren har tilgang
til. Én handling: **«Se hele katalogen»** til `/`.

For en bibliotekar nevner beskrivelsen ikke tilgang. Hun ser alt, og en
forklaring om tilgang ville sendt henne på leting etter en begrensning som ikke
finnes.

### Ett treff

Vises som ett kort med én rad, som alle andre resultater. **Ingen automatisk
videresending.**

En redirect på ett treff gjør oppførselen uforutsigbar: samme søk lander på
søkesiden i går og på en bokside i dag, alt etter hva som står i katalogen. En
leser som ville visst *at* det bare var ett treff får aldri vite det, og den som
skrev søket for å se om noe finnes får aldri svaret. Raden er ett klikk unna
posten uansett.

`CardDescription` sier «1 av 12 titler» i entall — teksten skal aldri lyde
«1 treff(er)».

---

## Hvor det hører hjemme i koden

Lagdelingen fra [`CLAUDE.md`](../CLAUDE.md) gjelder uendret. Konkret:

- **`lib/search.ts`** — den rene regelen: normalisering, delord,
  ISBN-gjenkjenning, flere ord, rangering. Ingen I/O, ingen import av
  `lib/db.ts` eller en tjeneste. Her ligger testene, og modulen skal kunne
  testes uten en eneste mock, som de andre regelmodulene.
- **En tjenestefunksjon** som leser gjennom `lib/db.ts`, bygger `*View`-typene
  fra `lib/loans.ts`, og **tar leseren som argument**, slik at
  tilgangsfiltreringen skjer der og ikke i visningen. Den hører hjemme sammen
  med de andre spørringene som går over flere posttyper.
- **`app/(app)/sok/page.tsx`** — serverkomponenten. Leser `?q=`, kaller
  tjenesten, rendrer. Ingen skriving, og ingenting i `lib/actions.ts`.
- **Søkefeltet** i `components/site-header.tsx`, som er en klientkomponent fra
  før. Selve skjemaet trenger ingen klientlogikk — bare gjeldende søk for å
  fylle feltet.

Resultattypen skal være en diskriminert union på posttype (`{ kind: "book";
book: BookView }` og så videre), ikke fire parallelle lister. Rangeringen
sorterer på tvers av typene, og fire lister ville tvunget den sorteringen ut i
visningen.

Ingen ny feilslug i `lib/errors.ts`. Søket har ingen skriving som kan feile, og
et tomt eller for kort søk er en tilstand på siden, ikke en feil å omdirigere
med.

Legg `/sok` i sidetabellen i [`README.md`](../README.md) når siden er bygget.

---

## Tester

`lib/search.test.ts`, mot den rene modulen, med norske testnavn som resten:

- versalfølsomhet av og på
- æ/ø/å matcher seg selv, og NFD-skrevet «å» matcher NFC-skrevet «å»
- delord midt i et felt treffer; ett enkelt tegn gjør det ikke
- flere ord er OG, og de kan treffe i hvert sitt felt
- ISBN med og uten bindestreker og mellomrom finner samme bok
- «1984» treffer tittel og år, ikke tilfeldige ISBN-er
- rangering: eksakt før prefiks før delord, og posttypeordenen holder
- taket på 50 kutter lista, men det totale antallet er fortsatt riktig

Tilgangsreglene testes der filtreringen skjer, ikke i den rene modulen: at en
låner finner seg selv og ingen andre, at hun finner sitt eget lån og ikke
andres, og at en som ikke er innlogget bare får bøker.

---

## Utenfor spesifikasjonen

Nevnt så en senere økt ikke tror det er glemt:

- **Filtre og fasetter** — «bare ledige», «bare forfalte». Statuser er avledet
  og hører til en filtreringsmodell, ikke en søkemodell.
- **Live-søk og forslag mens man skriver.** Krever klientstate eller et
  API-endepunkt, og bryter med at appen er serverkomponenter hele veien.
- **Skrivefeiltoleranse** («Rowlng» → «Rowling»). Redigeringsavstand er mye
  maskineri for et datagrunnlag i denne størrelsen.
- **Et søkeendepunkt i API-et.** Legges til når noe utenfor appen trenger det.
